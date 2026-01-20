import { CommonModule, DatePipe, Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Select, Store } from '@ngxs/store';
import { Observable, Subject, combineLatest, of } from 'rxjs';
import { mergeMap, switchMap, takeUntil, map, filter, startWith, distinctUntilChanged } from 'rxjs/operators';
import { BreadcrumbComponent } from '../../../shared/components/widgets/breadcrumb/breadcrumb.component';
import { NoDataComponent } from '../../../shared/components/widgets/no-data/no-data.component';
import { breadcrumb } from '../../../shared/interface/breadcrumb.interface';
import { Country, CountryModel } from '../../../shared/interface/country.interface';
import { OrderStatusModel } from '../../../shared/interface/order-status.interface';
import { Order } from '../../../shared/interface/order.interface';
import { States, StatesModel } from '../../../shared/interface/state.interface';
import { CurrencySymbolPipe } from '../../../shared/pipe/currency.pipe';
import { GetOrderStatus } from '../../../shared/store/action/order-status.action';
import { OrderTracking } from '../../../shared/store/action/order.action';
import { CountryState } from '../../../shared/store/state/country.state';
import { OrderStatusState } from '../../../shared/store/state/order-status.state';
import { OrderState } from '../../../shared/store/state/order.state';
import { StateState } from '../../../shared/store/state/state.state';

@Component({
    selector: 'app-order-details',
    imports: [TranslateModule, CurrencySymbolPipe, CommonModule,
        RouterModule, BreadcrumbComponent, NoDataComponent
    ],
    providers: [DatePipe],
    templateUrl: './order-details.component.html',
    styleUrl: './order-details.component.scss'
})
export class OrderDetailsComponent {

  orderStatus$: Observable<OrderStatusModel> = inject(Store).select(OrderStatusState.orderStatus);
  country$: Observable<CountryModel> = inject(Store).select(CountryState.country) as Observable<CountryModel>;
  state$: Observable<StatesModel> = inject(Store).select(StateState.state) as Observable<StatesModel>;

  // Observable que combina los estados de orden con las actividades para mostrar fechas
  orderStatusWithActivities$: Observable<OrderStatusModel>;

  private destroy$ = new Subject<void>();

  public order: Order | null;
  public email_or_phone: string;
  public countries: Country[] = [];
  public states: States[] = [];

  public breadcrumb: breadcrumb = {
    title: "Order Details",
    items: [{ label: 'Order Details', active: false }]
  };

  constructor(
    private store: Store,
    private route: ActivatedRoute,
    private location: Location,
    private datePipe: DatePipe
  ) {
    this.store.dispatch(new GetOrderStatus());
    this.country$.subscribe(country => this.countries = country.data);
    this.state$.subscribe(state => this.states = state.data);
    
    // Crear observable que combina orderStatus$ con las actividades de la orden
    // Usar startWith(null) para asegurar que combineLatest siempre emita
    this.orderStatusWithActivities$ = combineLatest([
      this.orderStatus$,
      this.store.select(OrderState.selectedOrder)
    ]).pipe(
      map(([orderStatusModel, order]) => {
        // Si no hay modelo de estados, retornar el modelo tal cual
        if (!orderStatusModel || !orderStatusModel.data) {
          return orderStatusModel;
        }

        // Si hay actividades de estado, mapear las fechas a los estados correspondientes
        if (order && order.order_status_activities && order.order_status_activities.length > 0) {
          const updatedStatuses = orderStatusModel.data.map(status => {
            // Buscar la actividad correspondiente por nombre del estado
            const activity = order.order_status_activities.find(
              act => act.status === status.name
            );
            
            if (activity && activity.changed_at) {
              // Formatear la fecha usando DatePipe
              const formattedDate = this.datePipe.transform(
                activity.changed_at,
                'dd MMM yyyy hh:mm a'
              );
              return {
                ...status,
                activities_date: formattedDate || ''
              };
            }
            
            return status;
          });

          return {
            ...orderStatusModel,
            data: updatedStatuses
          };
        }

        return orderStatusModel;
      })
    );
  }

  ngOnInit() {
    this.route.queryParams
      .pipe(
        switchMap(params => {
            this.email_or_phone = params['email_or_phone'];
            return this.store
                      .dispatch(new OrderTracking({ order_number: params['order_number'].toString(), email_or_phone: params['email_or_phone']}))
                      .pipe(mergeMap(() => this.store.select(OrderState.selectedOrder)))
          }
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(order => {
        this.order = order;
        this.order && (this.order.consumer = order?.guest_order ? order?.guest_order : order?.consumer);
        // Forzar actualización del observable cuando cambia la orden
        // El observable orderStatusWithActivities$ se actualizará automáticamente
        // porque depende de OrderState.selectedOrder que se actualiza aquí
      });
  }

  getCountryName(id: number) {
    return this.countries.find(country => country.id == id)?.name;
  }

  getStateName(id: number) {
    return this.states.find(state => state.id == id)?.name;
  }

  back(){
    this.location.back();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
