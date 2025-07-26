import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, Inject, inject, PLATFORM_ID, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { Select, Store } from '@ngxs/store';
import { Select2Data, Select2Module, Select2UpdateEvent } from 'ng-select2-component';
import { Observable, map, of } from 'rxjs';
import { AddressModalComponent } from '../../../shared/components/widgets/modal/address-modal/address-modal.component';
import { CouponModalComponent } from '../../../shared/components/widgets/modal/coupon-modal/coupon-modal.component';
import { BreadcrumbComponent } from '../../../shared/components/widgets/breadcrumb/breadcrumb.component';
import { ButtonComponent } from '../../../shared/components/widgets/button/button.component';
import { LoaderComponent } from '../../../shared/components/widgets/loader/loader.component';
import { NoDataComponent } from '../../../shared/components/widgets/no-data/no-data.component';
import { countryCodes } from '../../../shared/data/country-code';
import { AccountUser } from '../../../shared/interface/account.interface';
import { breadcrumb } from '../../../shared/interface/breadcrumb.interface';
import { Cart } from '../../../shared/interface/cart.interface';
import { CouponModel } from '../../../shared/interface/coupon.interface';
import { OrderCheckout } from '../../../shared/interface/order.interface';
import { DeliveryBlock, Values } from '../../../shared/interface/setting.interface';
import { CurrencySymbolPipe } from '../../../shared/pipe/currency.pipe';
import { CartService } from '../../../shared/services/cart.service';
import { ClearCart, SyncCart } from '../../../shared/store/action/cart.action';
import { GetCoupons } from '../../../shared/store/action/coupon.action';
import { Checkout, PlaceOrder } from '../../../shared/store/action/order.action';
import { GetSettingOption } from '../../../shared/store/action/setting.action';
import { AccountState } from '../../../shared/store/state/account.state';
import { AuthState } from '../../../shared/store/state/auth.state';
import { CartState } from '../../../shared/store/state/cart.state';
import { CountryState } from '../../../shared/store/state/country.state';
import { CouponState } from '../../../shared/store/state/coupon.state';
import { OrderState } from '../../../shared/store/state/order.state';
import { SettingState } from '../../../shared/store/state/setting.state';
import { StateState } from '../../../shared/store/state/state.state';
import { AddressBlockComponent } from './address-block/address-block.component';
import { DeliveryBlockComponent } from './delivery-block/delivery-block.component';
import { PaymentBlockComponent } from './payment-block/payment-block.component';
import { GetCartItems } from '../../../shared/store/action/cart.action';

@Component({
    selector: 'app-checkout',
    imports: [CommonModule, TranslateModule, CurrencySymbolPipe,
        FormsModule, ReactiveFormsModule, BreadcrumbComponent,
        AddressBlockComponent, DeliveryBlockComponent, PaymentBlockComponent,
        NoDataComponent, LoaderComponent, Select2Module, ButtonComponent],
    templateUrl: './checkout.component.html',
    styleUrl: './checkout.component.scss'
})
export class CheckoutComponent {

  public breadcrumb: breadcrumb = {
    title: "Check-out",
    items: [{ label: 'Check-out', active: true }]
  }

  user$: Observable<AccountUser> = inject(Store).select(AccountState.user) as Observable<AccountUser>;
  accessToken$: Observable<String> = inject(Store).select(AuthState.accessToken) as Observable<String>;
  cartItem$: Observable<Cart[]> = inject(Store).select(CartState.cartItems);
  checkout$: Observable<OrderCheckout> = inject(Store).select(OrderState.checkout) as Observable<OrderCheckout>;
  setting$: Observable<Values> = inject(Store).select(SettingState.setting) as Observable<Values>;
  cartDigital$: Observable<boolean | number> = inject(Store).select(CartState.cartHasDigital) as Observable<boolean | number>;
  countries$: Observable<Select2Data> = inject(Store).select(CountryState.countries);
  coupon$: Observable<CouponModel> = inject(Store).select(CouponState.coupon);

  @ViewChild('cpn', { static: false }) cpnRef: ElementRef<HTMLInputElement>;

  public form: FormGroup;
  public coupon: boolean = true;
  public couponCode: string;
  public appliedCoupon: boolean = false;
  public couponError: string | null;
  public checkoutTotal: OrderCheckout;
  public loading: boolean = false;

  public shippingStates$: Observable<Select2Data>;
  public billingStates$: Observable<Select2Data>;
  public codes = countryCodes;
  public isBrowser: boolean;

  constructor(
    private store: Store,
    private formBuilder: FormBuilder,
    public cartService: CartService,
    private modal: NgbModal,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.store.dispatch(new GetSettingOption());
    this.store.dispatch(new GetCoupons({ status: 1 }));
    
    // Cargar el carrito si el usuario está autenticado
    if (this.store.selectSnapshot(state => state.auth && state.auth.access_token)) {
      this.store.dispatch(new GetCartItems());
    }

    this.form = this.formBuilder.group({
      products: this.formBuilder.array([], [Validators.required]),
      shipping_address_id: new FormControl('', [Validators.required]),
      billing_address_id: new FormControl('', [Validators.required]),
      points_amount: new FormControl(false),
      wallet_balance: new FormControl(false),
      coupon: new FormControl(),
      delivery_description: new FormControl('', [Validators.required]),
      delivery_interval: new FormControl(),
      payment_method: new FormControl('', [Validators.required]),
      create_account: new FormControl(false),
      name: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email]),
      country_code: new FormControl('91', [Validators.required]),
      phone: new FormControl('', [Validators.required]),
      password: new FormControl(),
      shipping_address: new FormGroup({
        title: new FormControl('', [Validators.required]),
        street: new FormControl('', [Validators.required]),
        city: new FormControl('', [Validators.required]),
        phone: new FormControl('', [Validators.required]),
        pincode: new FormControl('', [Validators.required]),
        country_code: new FormControl('91', [Validators.required]),
        country_id: new FormControl('', [Validators.required]),
        state_id: new FormControl('', [Validators.required]),
      }),
      billing_address: new FormGroup({
        same_shipping: new FormControl(false),
        title: new FormControl('', [Validators.required]),
        street: new FormControl('', [Validators.required]),
        city: new FormControl('', [Validators.required]),
        phone: new FormControl('', [Validators.required]),
        pincode: new FormControl('', [Validators.required]),
        country_code: new FormControl('91', [Validators.required]),
        country_id: new FormControl('', [Validators.required]),
        state_id: new FormControl('', [Validators.required]),
      })
    });

    this.store.selectSnapshot(state => state.setting).setting.activation.guest_checkout = true;

    if(this.store.selectSnapshot(state => state.auth && state.auth.access_token)) {
      this.form.removeControl('create_account');
      this.form.removeControl('name');
      this.form.removeControl('email');
      this.form.removeControl('country_code');
      this.form.removeControl('phone');
      this.form.removeControl('password');
      this.form.removeControl('password_confirmation');
      this.form.removeControl('shipping_address');
      this.form.removeControl('billing_address');

      this.cartDigital$.subscribe(value => {
        if(value == 1) {
          this.form.controls['shipping_address_id'].clearValidators();
          this.form.controls['delivery_description'].clearValidators();
        } else {
          this.form.controls['shipping_address_id'].setValidators([Validators.required]);
          this.form.controls['delivery_description'].setValidators([Validators.required]);
        }
        this.form.controls['shipping_address_id'].updateValueAndValidity();
        this.form.controls['delivery_description'].updateValueAndValidity();
      });

    } else {

      if(this.store.selectSnapshot(state => state.setting).setting.activation.guest_checkout) {
        this.form.removeControl('shipping_address_id');
        this.form.removeControl('billing_address_id');
        this.form.removeControl('points_amount');
        this.form.removeControl('wallet_balance');

        this.form.controls['create_account'].valueChanges.subscribe(value => {
          if(value) {
            this.form.controls['name'].setValidators([Validators.required]);
            this.form.controls['password'].setValidators([Validators.required]);
          } else {
            this.form.controls['name'].clearValidators();
            this.form.controls['password'].clearValidators();
          }
          this.form.controls['name'].updateValueAndValidity();
          this.form.controls['password'].updateValueAndValidity();
        });

        this.form.statusChanges.subscribe(value => {
          if(value == 'VALID') {
            this.checkout();
          }
        });

      }

    }

    this.form.get('billing_address.same_shipping')?.valueChanges.subscribe(value => {
      if(value) {
        this.form.get('billing_address.title')?.setValue(this.form.get('shipping_address.title')?.value);
        this.form.get('billing_address.street')?.setValue(this.form.get('shipping_address.street')?.value);
        this.form.get('billing_address.country_id')?.setValue(this.form.get('shipping_address.country_id')?.value);
        this.form.get('billing_address.state_id')?.setValue(this.form.get('shipping_address.state_id')?.value);
        this.form.get('billing_address.city')?.setValue(this.form.get('shipping_address.city')?.value);
        this.form.get('billing_address.pincode')?.setValue(this.form.get('shipping_address.pincode')?.value);
        this.form.get('billing_address.country_code')?.setValue(this.form.get('shipping_address.country_code')?.value);
        this.form.get('billing_address.phone')?.setValue(this.form.get('shipping_address.phone')?.value);
      } else {
        this.form.get('billing_address.title')?.setValue('');
        this.form.get('billing_address.street')?.setValue('');
        this.form.get('billing_address.country_id')?.setValue('');
        this.form.get('billing_address.state_id')?.setValue('');
        this.form.get('billing_address.city')?.setValue('');
        this.form.get('billing_address.pincode')?.setValue('');
        this.form.get('billing_address.country_code')?.setValue('');
        this.form.get('billing_address.phone')?.setValue('');
      }
    });

    this.cartService.getUpdateQtyClickEvent().subscribe(() => {
      this.products();
      this.checkout();
    });
  }

  get productControl(): FormArray {
    return this.form.get("products") as FormArray;
  }

  // Función helper para obtener el user_id del localStorage
  private getUserIdFromLocalStorage(): number {
    if (!this.isBrowser) return 0;
    
    try {
      const account = JSON.parse(localStorage.getItem('account') || '{}');
      const userId = account.user?.id || 0;
      return userId;
    } catch (error) {
      return 0;
    }
  }

  // Función helper para cargar y sincronizar el carrito desde localStorage
  private loadCartFromLocalStorage() {
    if (!this.isBrowser) return;
    
    // Si el usuario está autenticado, cargar desde el backend pero también sincronizar localStorage
    if (this.store.selectSnapshot(state => state.auth && state.auth.access_token)) {
      this.store.dispatch(new GetCartItems());
      return;
    }
    
    // Si no está autenticado, cargar desde localStorage
    try {
      const cartData = localStorage.getItem('cart');
      if (cartData) {
        const cart = JSON.parse(cartData);
        
        // Verificar que el carrito tenga la estructura correcta
        if (cart && cart.items && Array.isArray(cart.items) && cart.items.length > 0) {
          // Verificar que cada item tenga los datos necesarios
          const validItems = cart.items.filter((item: any) => 
            item && item.product && item.product_id && item.quantity && item.sub_total
          );
          
          if (validItems.length > 0) {
            // Convertir los items del localStorage al formato esperado por SyncCart
            const syncItems = validItems.map((item: any) => ({
              id: null,
              product: item.product,
              product_id: item.product_id,
              variation: item.variation || null,
              variation_id: item.variation_id || null,
              quantity: item.quantity
            }));
            
            this.store.dispatch(new SyncCart(syncItems));
          } else {
            localStorage.removeItem('cart');
          }
        } else {
          localStorage.removeItem('cart');
        }
      }
    } catch (error) {
      // Limpiar localStorage si hay error de parsing
      localStorage.removeItem('cart');
    }
  }

  ngOnInit(): void {
    this.loadCartFromLocalStorage();
    this.loadUserData();
    this.loadSavedAddresses();
    this.setupFormSubscriptions();
  }

  private loadUserData(): void {
    this.user$.subscribe(user => {
      if (this.isBrowser && user?.address?.length) {
        const savedShippingAddress = localStorage.getItem('selected_shipping_address');
        const savedBillingAddress = localStorage.getItem('selected_billing_address');
        
        if (savedShippingAddress) {
          const shippingAddress = JSON.parse(savedShippingAddress);
          this.form.controls['shipping_address_id'].setValue(shippingAddress.id);
        }
        
        if (savedBillingAddress) {
          const billingAddress = JSON.parse(savedBillingAddress);
          this.form.controls['billing_address_id'].setValue(billingAddress.id);
        }
      }
    });
  }

  private loadSavedAddresses(): void {
    // Cargar direcciones guardadas en localStorage si existen
    if (this.isBrowser) {
      const savedShippingAddress = localStorage.getItem('selected_shipping_address');
      const savedBillingAddress = localStorage.getItem('selected_billing_address');
      
      if (savedShippingAddress) {
        const shippingAddress = JSON.parse(savedShippingAddress);
        this.form.controls['shipping_address_id'].setValue(shippingAddress.id);
      }
      
      if (savedBillingAddress) {
        const billingAddress = JSON.parse(savedBillingAddress);
        this.form.controls['billing_address_id'].setValue(billingAddress.id);
      }
    }
  }

  private setupFormSubscriptions(): void {
    this.checkout$.subscribe(data => {
      this.checkoutTotal = data;
    });
    
    this.products();
    
    // Ejecutar checkout después de un breve delay para asegurar que todo esté cargado
    setTimeout(() => {
      this.checkout();
    }, 1000);
  }

  products() {
    this.cartItem$.subscribe(items => {
      this.productControl.clear();
      items.forEach((item: Cart) =>
        this.productControl.push(
          this.formBuilder.group({
            product_id: new FormControl(item?.product_id, [Validators.required]),
            variation_id: new FormControl(item?.variation_id ? item?.variation_id : ''),
            quantity: new FormControl(item?.quantity),
          })
        ));
      
      // Ejecutar checkout automáticamente cuando se carguen los productos
      if(items.length > 0) {
        setTimeout(() => {
          this.checkout();
        }, 100);
      }
    });
  }

  selectShippingAddress(id: number) {
    if(id) {
      this.form.controls['shipping_address_id'].setValue(Number(id));
      
      // Guardar la dirección seleccionada en localStorage
      if (this.isBrowser) {
        const user = this.store.selectSnapshot(state => state.account?.user);
        const selectedAddress = user?.address?.find((addr: any) => addr.id === id);
        if (selectedAddress) {
          localStorage.setItem('selected_shipping_address', JSON.stringify(selectedAddress));
        }
      }
      
      this.checkout();
    }
  }

  selectBillingAddress(id: number) {
    if(id) {
      this.form.controls['billing_address_id'].setValue(Number(id));
      
      // Guardar la dirección seleccionada en localStorage
      if (this.isBrowser) {
        const user = this.store.selectSnapshot(state => state.account?.user);
        const selectedAddress = user?.address?.find((addr: any) => addr.id === id);
        if (selectedAddress) {
          localStorage.setItem('selected_billing_address', JSON.stringify(selectedAddress));
        }
      }
      
      this.checkout();
    }
  }

  selectDelivery(value: DeliveryBlock) {
    this.form.controls['delivery_description'].setValue(value?.delivery_description);
    this.form.controls['delivery_interval'].setValue(value?.delivery_interval);
    this.checkout();
  }

  selectPaymentMethod(value: string) {
    this.form.controls['payment_method'].setValue(value);
    this.checkout();
  }

  togglePoint(event: Event) {
    this.form.controls['points_amount'].setValue((<HTMLInputElement>event.target)?.checked);
    this.checkout();
  }

  toggleWallet(event: Event) {
    this.form.controls['wallet_balance'].setValue((<HTMLInputElement>event.target)?.checked);
    this.checkout();
  }

  showCoupon() {
    this.coupon = true;
  }

  setCoupon(value?: string) {
    this.couponError = null;

    if(value)
      this.form.controls['coupon'].setValue(value);
    else
      this.form.controls['coupon'].reset();

    this.store.dispatch(new Checkout(this.form.value)).subscribe({
      error: (err) => {
        this.couponError = err.message;
      },
      complete: () => {
        this.appliedCoupon = value ? true : false;
        this.couponError = null;
      }
    });
  }

  couponRemove() {
    this.setCoupon();
  }

  shippingCountryChange(data: Select2UpdateEvent) {
    if(data && data?.value) {
      this.shippingStates$ = this.store
          .select(StateState.states)
          .pipe(map(filterFn => filterFn(+data?.value)));
    } else {
      this.form.get('shipping_address.state_id')?.setValue('');
      this.shippingStates$ = of();
    }
  }

  billingCountryChange(data: Select2UpdateEvent) {
    if(data && data?.value) {
      this.billingStates$ = this.store
          .select(StateState.states)
          .pipe(map(filterFn => filterFn(+data?.value)));
      if(this.form.get('billing_address.same_shipping')?.value) {
        setTimeout(() => {
          this.form.get('billing_address.state_id')?.setValue(this.form.get('shipping_address.state_id')?.value);
        }, 200);
      }
    } else {
      this.form.get('billing_address.state_id')?.setValue('');
      this.billingStates$ = of();
    }
  }

  checkout() {
    // If has coupon error while checkout
    if(this.couponError){
      this.couponError = null;
      this.cpnRef.nativeElement.value = '';
      this.form.controls['coupon'].reset();
    }

    // Verificar si hay productos en el carrito
    const hasProducts = this.productControl.length > 0;

    // Permitir checkout si hay productos, incluso si el formulario no está completamente válido
    if(hasProducts) {
      this.loading = true;
      
      // Obtener user_id del localStorage
      const userId = this.getUserIdFromLocalStorage();
      
      // Crear un payload mínimo con los datos disponibles
      const checkoutPayload = {
        consumer_id: userId,
        products: this.form.value.products || [],
        shipping_address_id: this.form.value.shipping_address_id || null,
        billing_address_id: this.form.value.billing_address_id || null,
        points_amount: this.form.value.points_amount || false,
        wallet_balance: this.form.value.wallet_balance || false,
        coupon: this.form.value.coupon || null,
        delivery_description: this.form.value.delivery_description || '',
        delivery_interval: this.form.value.delivery_interval || '',
        payment_method: this.form.value.payment_method || ''
      };
      
      this.store.dispatch(new Checkout(checkoutPayload)).subscribe({
        next: (result) => {
        },
        error: (err) => {
          this.loading = false;
          throw new Error(err);
        },
        complete: () => {
          this.loading = false;
        }
      });
    } else {
      if(!this.form.valid) {
      }
    }
  }

  placeorder() {
    if(this.form.valid) {
      if(this.cpnRef && !this.cpnRef.nativeElement.value) {
        this.form.controls['coupon'].reset();
      }

      // Obtener el usuario del localStorage
      const userId = this.getUserIdFromLocalStorage();
      
      // Siempre obtener el carrito desde localStorage para la orden
      const cart = this.isBrowser ? JSON.parse(localStorage.getItem('cart') || '{}') : {};
      const cartItems = cart.items || [];

      // Obtener las direcciones completas del localStorage
      const addresses = this.isBrowser ? JSON.parse(localStorage.getItem('addresses') || '[]') : [];
      let billingAddress = addresses.find((a: any) => a.id == this.form.value.billing_address_id);
      let shippingAddress = addresses.find((a: any) => a.id == this.form.value.shipping_address_id);

      // Mapea los productos con el formato correcto para OrderProduct
      const products = cartItems.map((item: any) => ({
        product_id: item.product_id || item.product?.id,
        variation_id: item.variation_id || null,
        quantity: item.quantity,
        price: item.product?.price || 0,
        sale_price: item.product?.sale_price || 0,
        sub_total: item.sub_total || 0
      }));

      // Calcula los totales usando los datos del localStorage
      const amount = cartItems.reduce((acc: number, item: any) => {
        const itemSubTotal = Number(item.sub_total || 0);
        return acc + itemSubTotal;
      }, 0);
      const tax_total = 0; // Si tienes el cálculo, ponlo aquí
      const shipping_total = 0; // Si tienes el cálculo, ponlo aquí
      const total = amount + tax_total + shipping_total;
      
      // Arma el payload
      const payload = {
        consumer_id: userId,
        tax_total: tax_total,
        shipping_total: shipping_total,
        points_amount: this.form.value.points_amount,
        wallet_balance: this.form.value.wallet_balance,
        amount: this.checkoutTotal?.total?.sub_total || amount,
        total: this.checkoutTotal?.total?.total || total,
        is_digital_only: 0, // O 1 si solo hay productos digitales
        coupon_total_discount: 0, // Si tienes descuento por cupón
        payment_method: this.form.value.payment_method,
        billing_address: billingAddress,
        shipping_address: shippingAddress,
        products: products,
        delivery_description: this.form.value.delivery_description,
        delivery_interval: this.form.value.delivery_interval,
        coupon_id: this.form.value.coupon,
        shipping_address_id: this.form.value.shipping_address_id,
        billing_address_id: this.form.value.billing_address_id,
        created_at: new Date().toISOString()
      };
      
      this.store.dispatch(new PlaceOrder(payload));
    }
  }

  clearCart(){
    this.store.dispatch(new ClearCart());
  }

  openModal(){
    this.modal.open(AddressModalComponent, { centered: true, windowClass: 'theme-modal-2' })
  }

  couponModal(){
    this.modal.open(CouponModalComponent, { centered: true, windowClass: 'theme-modal-2 coupon-modal', size: 'lg' })
  }

  copyFunction(txt:string){
    navigator.clipboard.writeText(txt);
  }

  ngOnDestroy() {
    if(this.isBrowser) {
      // this.store.dispatch(new ClearCart()); // Comentado temporalmente para debug
      this.form.reset();
    }
  }
} 