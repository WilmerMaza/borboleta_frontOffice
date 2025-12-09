import { CommonModule, isPlatformBrowser } from "@angular/common";
import {
  Component,
  ElementRef,
  Inject,
  inject,
  PLATFORM_ID,
  ViewChild,
} from "@angular/core";
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { TranslateModule } from "@ngx-translate/core";
import { Select, Store } from "@ngxs/store";
import {
  Select2Data,
  Select2Module,
  Select2UpdateEvent,
} from "ng-select2-component";
import { Observable, map, of } from "rxjs";
import { AddressModalComponent } from "../../../shared/components/widgets/modal/address-modal/address-modal.component";
import { CouponModalComponent } from "../../../shared/components/widgets/modal/coupon-modal/coupon-modal.component";
import { OrderSuccessModalComponent } from "../../../shared/components/widgets/modal/order-success-modal/order-success-modal.component";
import { WarningModalComponent } from "../../../shared/components/widgets/modal/warning-modal/warning-modal.component";
import { BreadcrumbComponent } from "../../../shared/components/widgets/breadcrumb/breadcrumb.component";
import { ButtonComponent } from "../../../shared/components/widgets/button/button.component";
import { LoaderComponent } from "../../../shared/components/widgets/loader/loader.component";
import { NoDataComponent } from "../../../shared/components/widgets/no-data/no-data.component";
import { countryCodes } from "../../../shared/data/country-code";
import { AccountUser } from "../../../shared/interface/account.interface";
import { breadcrumb } from "../../../shared/interface/breadcrumb.interface";
import { Cart } from "../../../shared/interface/cart.interface";
import { CouponModel } from "../../../shared/interface/coupon.interface";
import { OrderCheckout } from "../../../shared/interface/order.interface";
import {
  DeliveryBlock,
  Values,
} from "../../../shared/interface/setting.interface";
import { CurrencySymbolPipe } from "../../../shared/pipe/currency.pipe";
import { CartService } from "../../../shared/services/cart.service";
import { ClearCart, SyncCart } from "../../../shared/store/action/cart.action";
import { GetCoupons } from "../../../shared/store/action/coupon.action";
import {
  Checkout,
  PlaceOrder,
} from "../../../shared/store/action/order.action";
import { GetSettingOption } from "../../../shared/store/action/setting.action";
import { AccountState } from "../../../shared/store/state/account.state";
import { AuthState } from "../../../shared/store/state/auth.state";
import { CartState } from "../../../shared/store/state/cart.state";
import { CountryState } from "../../../shared/store/state/country.state";
import { CouponState } from "../../../shared/store/state/coupon.state";
import { OrderState } from "../../../shared/store/state/order.state";
import { SettingState } from "../../../shared/store/state/setting.state";
import { StateState } from "../../../shared/store/state/state.state";
import { AddressBlockComponent } from "./address-block/address-block.component";
import { DeliveryBlockComponent } from "./delivery-block/delivery-block.component";
import { PaymentBlockComponent } from "./payment-block/payment-block.component";
import { GetCartItems } from "../../../shared/store/action/cart.action";
import { GetAddresses, GetUserDetails } from "../../../shared/store/action/account.action";
import { AuthService } from "../../../shared/services/auth.service";
import { WompiService } from "../../../shared/services/wompi.service";
import { Router } from "@angular/router";
import { WompiButtonComponent, WompiButtonConfig } from "./wompi-button/wompi-button.component";

@Component({
  selector: "app-checkout",
  imports: [
    CommonModule,
    TranslateModule,
    CurrencySymbolPipe,
    FormsModule,
    ReactiveFormsModule,
    BreadcrumbComponent,
    AddressBlockComponent,
    DeliveryBlockComponent,
    PaymentBlockComponent,
    NoDataComponent,
    LoaderComponent,
    Select2Module,
    ButtonComponent,
    WompiButtonComponent,
  ],
  templateUrl: "./checkout.component.html",
  styleUrl: "./checkout.component.scss",
})
export class CheckoutComponent {
  public breadcrumb: breadcrumb = {
    title: "Check-out",
    items: [{ label: "Check-out", active: true }],
  };

  user$: Observable<AccountUser> = inject(Store).select(
    AccountState.user
  ) as Observable<AccountUser>;
  accessToken$: Observable<String> = inject(Store).select(
    AuthState.accessToken
  ) as Observable<String>;
  cartItem$: Observable<Cart[]> = inject(Store).select(CartState.cartItems);
  checkout$: Observable<OrderCheckout> = inject(Store).select(
    OrderState.checkout
  ) as Observable<OrderCheckout>;
  setting$: Observable<Values> = inject(Store).select(
    SettingState.setting
  ) as Observable<Values>;
  cartDigital$: Observable<boolean | number> = inject(Store).select(
    CartState.cartHasDigital
  ) as Observable<boolean | number>;
  countries$: Observable<Select2Data> = inject(Store).select(
    CountryState.countries
  );
  coupon$: Observable<CouponModel> = inject(Store).select(CouponState.coupon);

  @ViewChild("cpn", { static: false }) cpnRef: ElementRef<HTMLInputElement>;

  public form: FormGroup;
  public coupon: boolean = true;
  public couponCode: string;
  public appliedCoupon: boolean = false;
  public couponError: string | null;
  public checkoutTotal: OrderCheckout | null = null;
  public loading: boolean = false;

  public shippingStates$: Observable<Select2Data>;
  public billingStates$: Observable<Select2Data>;
  public codes = countryCodes;
  public isBrowser: boolean;
  cartItemsFromLocal: Cart[];
  public showWompiWidget = false;
  public wompiWidgetConfig: WompiButtonConfig | null = null;
  private pendingCheckoutPayload: any = null;
  private addressesLoaded = false;
  private isProcessingOrder = false; // Bandera para evitar procesar la orden múltiples veces
  private processedTransactionIds = new Set<string>(); // Set para rastrear transactionIds ya procesados

  constructor(
    private store: Store,
    private formBuilder: FormBuilder,
    public cartService: CartService,
    private modal: NgbModal,
    private authService: AuthService,
    private wompiService: WompiService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.store.dispatch(new GetSettingOption());
    this.store.dispatch(new GetCoupons({ status: 1 }));

    // Cargar el carrito y direcciones si el usuario está autenticado
    if (
      this.store.selectSnapshot(
        (state) => state.auth && state.auth.access_token
      )
    ) {
      this.store.dispatch(new GetCartItems());
      this.store.dispatch(new GetAddresses()); // Cargar direcciones del usuario
    }

    this.form = this.formBuilder.group({
      products: this.formBuilder.array([], [Validators.required]),
      shipping_address_id: new FormControl("", [Validators.required]),
      billing_address_id: new FormControl("", [Validators.required]),
      points_amount: new FormControl(false),
      wallet_balance: new FormControl(false),
      coupon: new FormControl(),
      delivery_description: new FormControl("", [Validators.required]),
      delivery_interval: new FormControl(),
      payment_method: new FormControl("wompi", [Validators.required]),
      create_account: new FormControl(false),
      name: new FormControl("", [Validators.required]),
      email: new FormControl("", [Validators.required, Validators.email]),
      country_code: new FormControl("91", [Validators.required]),
      phone: new FormControl("", [Validators.required]),
      password: new FormControl(),
      shipping_address: new FormGroup({
        title: new FormControl("", [Validators.required]),
        street: new FormControl("", [Validators.required]),
        city: new FormControl("", [Validators.required]),
        phone: new FormControl("", [Validators.required]),
        pincode: new FormControl("", [Validators.required]),
        country_code: new FormControl("91", [Validators.required]),
        country_id: new FormControl("", [Validators.required]),
        state_id: new FormControl("", [Validators.required]),
      }),
      billing_address: new FormGroup({
        same_shipping: new FormControl(false),
        title: new FormControl("", [Validators.required]),
        street: new FormControl("", [Validators.required]),
        city: new FormControl("", [Validators.required]),
        phone: new FormControl("", [Validators.required]),
        pincode: new FormControl("", [Validators.required]),
        country_code: new FormControl("91", [Validators.required]),
        country_id: new FormControl("", [Validators.required]),
        state_id: new FormControl("", [Validators.required]),
      }),
    });

    const settingSnapshot = this.store.selectSnapshot((state) => state.setting);
    if (
      settingSnapshot &&
      settingSnapshot.setting &&
      settingSnapshot.setting.activation
    ) {
      settingSnapshot.setting.activation.guest_checkout = true;
    }

    if (
      this.store.selectSnapshot(
        (state) => state.auth && state.auth.access_token
      )
    ) {
      this.form.removeControl("create_account");
      this.form.removeControl("name");
      this.form.removeControl("email");
      this.form.removeControl("country_code");
      this.form.removeControl("phone");
      this.form.removeControl("password");
      this.form.removeControl("password_confirmation");
      this.form.removeControl("shipping_address");
      this.form.removeControl("billing_address");

      this.cartDigital$.subscribe((value) => {
        if (value == 1) {
          this.form.controls["shipping_address_id"].clearValidators();
          this.form.controls["delivery_description"].clearValidators();
        } else {
          this.form.controls["shipping_address_id"].setValidators([
            Validators.required,
          ]);
          this.form.controls["delivery_description"].setValidators([
            Validators.required,
          ]);
        }
        this.form.controls["shipping_address_id"].updateValueAndValidity();
        this.form.controls["delivery_description"].updateValueAndValidity();
      });
    } else {
      if (
        this.store.selectSnapshot((state) => state.setting).setting?.activation
          .guest_checkout
      ) {
        // NO eliminamos los controles, solo los hacemos opcionales para guest:
        this.form.get("shipping_address_id")?.clearValidators();
        this.form.get("billing_address_id")?.clearValidators();
        this.form.get("points_amount")?.clearValidators();
        this.form.get("wallet_balance")?.clearValidators();

        this.form.get("shipping_address_id")?.updateValueAndValidity({ emitEvent: false });
        this.form.get("billing_address_id")?.updateValueAndValidity({ emitEvent: false });
        this.form.get("points_amount")?.updateValueAndValidity({ emitEvent: false });
        this.form.get("wallet_balance")?.updateValueAndValidity({ emitEvent: false });

        this.form.controls["create_account"].valueChanges.subscribe((value) => {
          if (value) {
            this.form.controls["name"].setValidators([Validators.required]);
            this.form.controls["password"].setValidators([Validators.required]);
          } else {
            this.form.controls["name"].clearValidators();
            this.form.controls["password"].clearValidators();
          }
          this.form.controls["name"].updateValueAndValidity();
          this.form.controls["password"].updateValueAndValidity();
        });

        this.form.statusChanges.subscribe((value) => {
          if (value == "VALID") {
            this.checkout();
          }
        });
      }
    }

    this.form
      .get("billing_address.same_shipping")
      ?.valueChanges.subscribe((value) => {
        if (value) {
          this.form
            .get("billing_address.title")
            ?.setValue(this.form.get("shipping_address.title")?.value);
          this.form
            .get("billing_address.street")
            ?.setValue(this.form.get("shipping_address.street")?.value);
          this.form
            .get("billing_address.country_id")
            ?.setValue(this.form.get("shipping_address.country_id")?.value);
          this.form
            .get("billing_address.state_id")
            ?.setValue(this.form.get("shipping_address.state_id")?.value);
          this.form
            .get("billing_address.city")
            ?.setValue(this.form.get("shipping_address.city")?.value);
          this.form
            .get("billing_address.pincode")
            ?.setValue(this.form.get("shipping_address.pincode")?.value);
          this.form
            .get("billing_address.country_code")
            ?.setValue(this.form.get("shipping_address.country_code")?.value);
          this.form
            .get("billing_address.phone")
            ?.setValue(this.form.get("shipping_address.phone")?.value);
        } else {
          this.form.get("billing_address.title")?.setValue("");
          this.form.get("billing_address.street")?.setValue("");
          this.form.get("billing_address.country_id")?.setValue("");
          this.form.get("billing_address.state_id")?.setValue("");
          this.form.get("billing_address.city")?.setValue("");
          this.form.get("billing_address.pincode")?.setValue("");
          this.form.get("billing_address.country_code")?.setValue("");
          this.form.get("billing_address.phone")?.setValue("");
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

  getCartItemsForDisplay(): Cart[] {
    // Si hay items en el store, usarlos; sino, usar los del localStorage
    const storeItems =
      this.store.selectSnapshot((state) => state.cart?.items) || [];
    return storeItems.length > 0 ? storeItems : this.cartItemsFromLocal;
  }

  // Función helper para obtener el user_id del localStorage
  private getUserIdFromLocalStorage(): number {
    if (!this.isBrowser) return 0;

    try {
      const account = JSON.parse(localStorage.getItem("account") || "{}");
      const userId = account.user?.id || 0;
      return userId;
    } catch (error) {
      return 0;
    }
  }

  // Función helper para cargar y sincronizar el carrito desde localStorage
  private loadCartFromLocalStorage() {
    if (!this.isBrowser) return;

    // Siempre cargar el carrito desde localStorage, independientemente del estado de autenticación
    try {
      const cartData = localStorage.getItem("cart");
      if (cartData) {
        const cart = JSON.parse(cartData);
        if (
          cart &&
          cart.items &&
          Array.isArray(cart.items) &&
          cart.items.length > 0
        ) {
          // Cargar el carrito en el store y ejecutar checkout cuando termine
          this.store.dispatch(new GetCartItems()).subscribe({
            complete: () => {
              // Después de cargar el carrito, ejecutar checkout inmediatamente
              setTimeout(() => {
                this.checkout();
              }, 100);
            }
          });
        }
      }
    } catch (error) {
      // Limpiar localStorage si hay error de parsing
      localStorage.removeItem("cart");
    }
  }

  ngOnInit(): void {
    // Primero setup subscriptions para que los observables estén listos
    this.setupFormSubscriptions();
    
    // Cargar el carrito desde localStorage y ejecutar checkout
    this.loadCartFromLocalStorage();
    
    this.loadUserData();
    this.loadSavedAddresses();
    this.loadCartItemsFromLocal();
    
    // Ejecutar checkout de forma inmediata y también con varios timeouts para asegurar
    if (this.isBrowser) {
      // Primer intento: inmediato (50ms)
      setTimeout(() => {
        const cart = JSON.parse(localStorage.getItem("cart") || "{}");
        if (cart && cart.items && cart.items.length > 0) {
          this.checkout();
        }
      }, 50);
      
      // Segundo intento: después de un momento (300ms)
      setTimeout(() => {
        const cart = JSON.parse(localStorage.getItem("cart") || "{}");
        if (cart && cart.items && cart.items.length > 0) {
          const currentCheckout = this.store.selectSnapshot(OrderState.checkout);
          if (!currentCheckout || !currentCheckout.total || !currentCheckout.total.sub_total || currentCheckout.total.sub_total === 0) {
            this.checkout();
          }
        }
      }, 300);
      
      // Tercer intento: último recurso (700ms)
      setTimeout(() => {
        const cart = JSON.parse(localStorage.getItem("cart") || "{}");
        if (cart && cart.items && cart.items.length > 0) {
          const currentCheckout = this.store.selectSnapshot(OrderState.checkout);
          if (!currentCheckout || !currentCheckout.total || !currentCheckout.total.sub_total || currentCheckout.total.sub_total === 0) {
            this.checkout();
          }
        }
      }, 700);
    }

    // 👇 NUEVO: escuchar cuando el usuario se autentica
    this.accessToken$.subscribe((token) => {
      if (token && !this.addressesLoaded) {
        this.addressesLoaded = true;

        // Cargar datos del usuario y sus direcciones
        this.store.dispatch(new GetUserDetails()).subscribe({
          complete: () => {
            this.store.dispatch(new GetAddresses()).subscribe({
              complete: () => {
                // Después de que lleguen direcciones, recargar valores en el formulario
                this.loadUserData();
                this.checkout();
              }
            });
          }
        });
      }
    });
  }

  private loadCartItemsFromLocal() {
    if (this.isBrowser) {
      const cart = JSON.parse(localStorage.getItem("cart") || "{}");
      this.cartItemsFromLocal = cart.items || [];
    }
  }

  private loadUserData(): void {
    this.user$.subscribe((user) => {
      if (this.isBrowser && user?.address?.length) {
        const isDigitalOnly = this.store.selectSnapshot((state) => state.cart?.is_digital_only);
        const savedShippingAddress = localStorage.getItem("selected_shipping_address");
        const savedBillingAddress = localStorage.getItem("selected_billing_address");

        // Asignar dirección de envío
        if (savedShippingAddress) {
          try {
            const shippingAddress = JSON.parse(savedShippingAddress);
            // Verificar que la dirección guardada aún existe
            if (user.address.some((addr: any) => addr.id === shippingAddress.id)) {
              this.form.controls["shipping_address_id"].setValue(shippingAddress.id);
            } else if (!isDigitalOnly && user.address.length > 0) {
              // Si la dirección guardada ya no existe, usar la primera
              this.form.controls["shipping_address_id"].setValue(user.address[0].id);
            }
          } catch (e) {
            // Si hay error parseando, usar la primera dirección
            if (!isDigitalOnly && user.address.length > 0) {
              this.form.controls["shipping_address_id"].setValue(user.address[0].id);
            }
          }
        } else if (!isDigitalOnly && user.address.length > 0) {
          // Si no hay dirección guardada, usar la primera disponible
          this.form.controls["shipping_address_id"].setValue(user.address[0].id);
          // Guardar en localStorage
          localStorage.setItem("selected_shipping_address", JSON.stringify(user.address[0]));
        }

        // Asignar dirección de facturación
        if (savedBillingAddress) {
          try {
            const billingAddress = JSON.parse(savedBillingAddress);
            // Verificar que la dirección guardada aún existe
            if (user.address.some((addr: any) => addr.id === billingAddress.id)) {
              this.form.controls["billing_address_id"].setValue(billingAddress.id);
            } else if (user.address.length > 0) {
              // Si la dirección guardada ya no existe, usar la primera
              this.form.controls["billing_address_id"].setValue(user.address[0].id);
            }
          } catch (e) {
            // Si hay error parseando, usar la primera dirección
            if (user.address.length > 0) {
              this.form.controls["billing_address_id"].setValue(user.address[0].id);
            }
          }
        } else if (user.address.length > 0) {
          // Si no hay dirección guardada, usar la primera disponible
          this.form.controls["billing_address_id"].setValue(user.address[0].id);
          // Guardar en localStorage
          localStorage.setItem("selected_billing_address", JSON.stringify(user.address[0]));
        }

        // Actualizar validadores según si es digital o físico
        if (isDigitalOnly) {
          this.form.get("shipping_address_id")?.clearValidators();
        } else {
          this.form.get("shipping_address_id")?.setValidators([Validators.required]);
        }
        this.form.get("billing_address_id")?.setValidators([Validators.required]);

        // Actualizar validación del formulario
        this.form.get("shipping_address_id")?.updateValueAndValidity({ emitEvent: true });
        this.form.get("billing_address_id")?.updateValueAndValidity({ emitEvent: true });

        // Forzar actualización completa del formulario
        this.form.updateValueAndValidity({ emitEvent: true });
      }
    });
  }

  private loadSavedAddresses(): void {
    // Cargar direcciones guardadas en localStorage si existen
    if (this.isBrowser) {
      const savedShippingAddress = localStorage.getItem(
        "selected_shipping_address"
      );
      const savedBillingAddress = localStorage.getItem(
        "selected_billing_address"
      );

      if (savedShippingAddress) {
        const shippingAddress = JSON.parse(savedShippingAddress);
        this.form.controls["shipping_address_id"].setValue(shippingAddress.id);
      }

      if (savedBillingAddress) {
        const billingAddress = JSON.parse(savedBillingAddress);
        this.form.controls["billing_address_id"].setValue(billingAddress.id);
      }
    }
  }

  private setupFormSubscriptions(): void {
    this.checkout$.subscribe((data) => {
      if (data) {
        this.checkoutTotal = data;
      }
    });

    this.products();
    
    // Calcular checkout automáticamente cuando hay items en el carrito
    this.cartItem$.subscribe((items) => {
      if (items && items.length > 0) {
        // Ejecutar checkout inmediatamente cuando hay items
        setTimeout(() => {
          this.checkout();
        }, 100);
      }
    });
    
    // Ejecutar checkout también directamente desde localStorage (no depende del store)
    if (this.isBrowser) {
      // Múltiples intentos para asegurar que se ejecute
      setTimeout(() => {
        const cart = JSON.parse(localStorage.getItem("cart") || "{}");
        if (cart && cart.items && cart.items.length > 0) {
          const currentCheckout = this.store.selectSnapshot(OrderState.checkout);
          if (!currentCheckout || !currentCheckout.total || currentCheckout.total.sub_total === 0 || !currentCheckout.total.sub_total) {
            this.checkout();
          }
        }
      }, 300);
    }
  }

  products() {
    this.cartItem$.subscribe((items) => {
      this.productControl.clear();
      items.forEach((item: Cart) =>
        this.productControl.push(
          this.formBuilder.group({
            product_id: new FormControl(item?.product_id, [
              Validators.required,
            ]),
            variation_id: new FormControl(
              item?.variation_id ? item?.variation_id : ""
            ),
            quantity: new FormControl(item?.quantity),
          })
        )
      );
    });
  }

  selectShippingAddress(id: number) {
    if (id) {
      this.form.controls["shipping_address_id"].setValue(Number(id));

      // Guardar la dirección seleccionada en localStorage
      if (this.isBrowser) {
        const user = this.store.selectSnapshot((state) => state.account?.user);
        const selectedAddress = user?.address?.find(
          (addr: any) => addr.id === id
        );
        if (selectedAddress) {
          localStorage.setItem(
            "selected_shipping_address",
            JSON.stringify(selectedAddress)
          );
        }
      }

      this.checkout();
    }
  }

  selectBillingAddress(id: number) {
    if (id) {
      this.form.controls["billing_address_id"].setValue(Number(id));

      // Guardar la dirección seleccionada en localStorage
      if (this.isBrowser) {
        const user = this.store.selectSnapshot((state) => state.account?.user);
        const selectedAddress = user?.address?.find(
          (addr: any) => addr.id === id
        );
        if (selectedAddress) {
          localStorage.setItem(
            "selected_billing_address",
            JSON.stringify(selectedAddress)
          );
        }
      }

      this.checkout();
    }
  }

  selectDelivery(value: DeliveryBlock) {
    this.form.controls["delivery_description"].setValue(
      value?.delivery_description
    );
    this.form.controls["delivery_interval"].setValue(value?.delivery_interval);
    this.checkout();
  }

  selectPaymentMethod(value: string) {
    this.form.controls["payment_method"].setValue(value);
    if (value !== 'wompi' && this.showWompiWidget) {
      this.cancelWompiWidget();
    }
    this.checkout();
  }

  togglePoint(event: Event) {
    this.form.controls["points_amount"].setValue(
      (<HTMLInputElement>event.target)?.checked
    );
    this.checkout();
  }

  toggleWallet(event: Event) {
    this.form.controls["wallet_balance"].setValue(
      (<HTMLInputElement>event.target)?.checked
    );
    this.checkout();
  }

  showCoupon() {
    this.coupon = true;
  }

  setCoupon(value?: string) {
    this.couponError = null;

    if (value) this.form.controls["coupon"].setValue(value);
    else this.form.controls["coupon"].reset();

    this.store.dispatch(new Checkout(this.form.value)).subscribe({
      error: (err) => {
        this.couponError = err.message;
      },
      complete: () => {
        this.appliedCoupon = value ? true : false;
        this.couponError = null;
      },
    });
  }

  couponRemove() {
    this.setCoupon();
  }

  shippingCountryChange(data: Select2UpdateEvent) {
    if (data && data?.value) {
      this.shippingStates$ = this.store
        .select(StateState.states)
        .pipe(map((filterFn) => filterFn(+data?.value)));
    } else {
      this.form.get("shipping_address.state_id")?.setValue("");
      this.shippingStates$ = of();
    }
  }

  billingCountryChange(data: Select2UpdateEvent) {
    if (data && data?.value) {
      this.billingStates$ = this.store
        .select(StateState.states)
        .pipe(map((filterFn) => filterFn(+data?.value)));

      if (this.form.get("billing_address.same_shipping")?.value) {
        this.form
          .get("billing_address.state_id")
          ?.setValue(this.form.get("shipping_address.state_id")?.value || "");
      }
    } else {
      this.form.get("billing_address.state_id")?.setValue("");
      this.billingStates$ = of();
    }
  }

  checkout() {
    // If has coupon error while checkout
    if (this.couponError) {
      this.couponError = null;
      if (this.cpnRef) {
        this.cpnRef.nativeElement.value = "";
      }
      this.form.controls["coupon"].reset();
    }

    if (!this.isBrowser) return;

    // 👇 CARRITO REAL: SIEMPRE DESDE LOCALSTORAGE (la fuente de verdad)
    const cart = JSON.parse(localStorage.getItem("cart") || "{}");
    const cartItems = cart.items || [];

    // Si no hay productos, no calculamos nada
    if (!cartItems.length) {
      this.loading = false;
      this.checkoutTotal = null;
      return;
    }

    this.loading = true;

    const userId = this.getUserIdFromLocalStorage();

    // Construir productos con datos completos que el estado pueda usar para calcular
    const products = cartItems.map((item: any) => ({
      product_id: item.product_id || item.product?.id,
      variation_id: item.variation_id || null,
      quantity: item.quantity,

      // Datos numéricos para el cálculo (CRÍTICO)
      sub_total: item.sub_total || 0,
      wholesale_price: item.wholesale_price || null,
      single_price:
        item.sub_total && item.quantity
          ? item.sub_total / item.quantity
          : (item.variation
              ? (item.variation.sale_price || item.variation.price || 0)
              : (item.product?.sale_price || item.product?.price || 0)),

      // Info extra por si la necesitas después
      product: item.product,
      variation: item.variation,
    }));

    const checkoutPayload = {
      consumer_id: userId || 0,
      products,
      shipping_address_id: this.form.value.shipping_address_id || null,
      billing_address_id: this.form.value.billing_address_id || null,
      points_amount: this.form.value.points_amount || false,
      wallet_balance: this.form.value.wallet_balance || false,
      coupon: this.form.value.coupon || null,
      delivery_description: this.form.value.delivery_description || "",
      delivery_interval: this.form.value.delivery_interval || "",
      payment_method: this.form.value.payment_method || "",
    };

    this.store.dispatch(new Checkout(checkoutPayload)).subscribe({
      next: () => {},
      error: (err) => {
        this.loading = false;
        console.error("Error en checkout:", err);
        this.checkoutTotal = null;
      },
      complete: () => {
        this.loading = false;
        // Verificar el estado después de un momento
        setTimeout(() => {
          const checkoutState = this.store.selectSnapshot(OrderState.checkout);
          this.checkoutTotal = checkoutState;
        }, 100);
      },
    });
  }

  placeorder() {
    // Verificar si el usuario está autenticado
    const isAuthenticated = this.store.selectSnapshot(
      (state) => state.auth && state.auth.access_token
    );

    if (!isAuthenticated) {
      this.openModalLogin();
      return;
    }

    // Forzar actualización de validación antes de verificar si es válido
    this.form.updateValueAndValidity({ emitEvent: false });

    // Verificar campos críticos manualmente antes de verificar form.valid
    const isDigitalOnly = this.store.selectSnapshot((state) => state.cart?.is_digital_only);
    const hasShippingAddress = this.form.controls['shipping_address_id']?.value || isDigitalOnly;
    const hasBillingAddress = this.form.controls['billing_address_id']?.value;
    const hasPaymentMethod = this.form.controls['payment_method']?.value;
    const hasProducts = this.productControl.length > 0;

    // Si el formulario es válido O si todos los campos críticos tienen valores, proceder
    if (this.form.valid || (hasShippingAddress && hasBillingAddress && hasPaymentMethod && hasProducts)) {
      if (this.cpnRef && !this.cpnRef.nativeElement.value) {
        this.form.controls["coupon"].reset();
      }

      // Obtener el usuario del localStorage
      const userId = this.getUserIdFromLocalStorage();

      // Siempre obtener el carrito desde localStorage para la orden
      const cart = this.isBrowser
        ? JSON.parse(localStorage.getItem("cart") || "{}")
        : {};
      const cartItems = cart.items || [];

      // Obtener las direcciones completas del localStorage
      const addresses = this.isBrowser
        ? JSON.parse(localStorage.getItem("addresses") || "[]")
        : [];
      let billingAddress = addresses.find(
        (a: any) => a.id == this.form.value.billing_address_id
      );
      let shippingAddress = addresses.find(
        (a: any) => a.id == this.form.value.shipping_address_id
      );

      // Mapea los productos con toda la información desde el carrito local
      const products = cartItems.map((item: any) => {
        // Incluir toda la información del producto desde el carrito local
        const productData = {
          // IDs básicos
          product_id: item.product_id || item.product?.id,
          variation_id: item.variation_id || null,
          quantity: item.quantity,

          // Información completa del producto desde el carrito local
          product: {
            id: item.product?.id,
            name: item.product?.name,
            slug: item.product?.slug,
            sku: item.product?.sku,
            description: item.product?.description,
            short_description: item.product?.short_description,
            product_type: item.product?.product_type,
            price: item.product?.price,
            sale_price: item.product?.sale_price,
            discount: item.product?.discount,
            weight: item.product?.weight,
            unit: item.product?.unit,
            stock_status: item.product?.stock_status,
            stock: item.product?.stock,
            brand_id: item.product?.brand_id,
            tax_id: item.product?.tax_id,
            store_id: item.product?.store_id,
            is_featured: item.product?.is_featured,
            is_trending: item.product?.is_trending,
            is_return: item.product?.is_return,
            is_sale_enable: item.product?.is_sale_enable,
            safe_checkout: item.product?.safe_checkout,
            secure_checkout: item.product?.secure_checkout,
            social_share: item.product?.social_share,
            encourage_order: item.product?.encourage_order,
            encourage_view: item.product?.encourage_view,
            is_free_shipping: item.product?.is_free_shipping,
            status: item.product?.status,
            created_at: item.product?.created_at,
            updated_at: item.product?.updated_at,
          },

          // Información de variación si existe
          variation: item.variation
            ? {
                id: item.variation.id,
                name: item.variation.name,
                sku: item.variation.sku,
                price: item.variation.price,
                sale_price: item.variation.sale_price,
                quantity: item.variation.quantity,
                stock_status: item.variation.stock_status,
              }
            : null,

          // Precios tomados directamente del carrito local
          single_price: item.sub_total / item.quantity, // Precio unitario calculado desde el subtotal del carrito
          subtotal: item.sub_total, // Subtotal exacto del carrito local
          wholesale_price: item.wholesale_price || null,
        };

        return productData;
      });

      // Calcula los totales usando los datos del localStorage
      const amount = cartItems.reduce((acc: number, item: any) => {
        const itemSubTotal = Number(item.sub_total || 0);
        return acc + itemSubTotal;
      }, 0);
      const tax_total = amount * 0.05; // Calcular impuesto como 5% del subtotal
      const shipping_total = 0; // Si tienes el cálculo, ponlo aquí
      const total = amount + tax_total + shipping_total;

      // Arma el payload
      const payload = {
        consumer_id: userId,
        products: products, // Usar 'products' para coincidir con la interfaz
        shipping_address_id: this.form.value.shipping_address_id || 0,
        billing_address_id: this.form.value.billing_address_id || 0,
        coupon: this.form.value.coupon || null,
        points_amount: this.form.value.points_amount || false,
        wallet_balance: this.form.value.wallet_balance || false,
        delivery_description: this.form.value.delivery_description || "",
        delivery_interval: this.form.value.delivery_interval || "",
        payment_method: this.form.value.payment_method || "",
        tax_total: tax_total,
        shipping_total: shipping_total,
        total: total,
      };

      // Verificar si el método de pago es Wompi
      // IMPORTANTE: Solo se permite crear órdenes con Wompi
      const paymentMethod = this.form.value.payment_method || '';
      const isWompiPayment = paymentMethod === 'wompi';

      // Validar que el método de pago sea Wompi
      if (!isWompiPayment) {
        this.loading = false;
        const modalRef = this.modal.open(WarningModalComponent, {
          centered: true,
          windowClass: 'theme-modal-2',
          backdrop: 'static',
          keyboard: false
        });
        modalRef.componentInstance.title = 'Método de Pago Requerido';
        modalRef.componentInstance.message = 'Solo se permite realizar pedidos con Wompi. Por favor selecciona Wompi como método de pago.';
        return;
      }

      if (isWompiPayment) {
        // SI ES WOMPI: Guardar datos del checkout y obtener datos del widget
        this.loading = true;
        
        const user = this.store.selectSnapshot((state) => state.account?.user);
        
        // Guardar payload "lógico" por si se necesita en el front
        this.pendingCheckoutPayload = payload;

        // Obtener direcciones completas y limpiar/serializar datos
        let shippingAddress = null;
        let billingAddress = null;
        
        // Función helper para limpiar direcciones (convertir objetos a valores primitivos)
        const cleanAddress = (address: any): any => {
          if (!address) return null;
          
          const cleaned: any = {};
          for (const key in address) {
            if (address.hasOwnProperty(key)) {
              const value = address[key];
              // Si es un objeto Date, convertir a string ISO
              if (value instanceof Date) {
                cleaned[key] = value.toISOString();
              }
              // Si es un objeto FormControl o similar, obtener su value
              else if (value && typeof value === 'object' && 'value' in value) {
                cleaned[key] = value.value;
              }
              // Si es null o undefined, omitirlo
              else if (value === null || value === undefined) {
                // No incluir campos nulos o undefined
              }
              // Si es un tipo primitivo, incluirlo
              else {
                cleaned[key] = value;
              }
            }
          }
          return cleaned;
        };
        
        // Obtener direcciones - PRIORIDAD: Usuario autenticado primero
        const isDigitalOnly = this.store.selectSnapshot((state) => state.cart?.is_digital_only);
        
        // PRIORIDAD 1: Obtener direcciones del usuario usando los IDs del formulario
        if (user?.address && Array.isArray(user.address) && user.address.length > 0) {
          // BILLING ADDRESS desde usuario
          const billingAddressId = payload.billing_address_id || this.form.value.billing_address_id;
          if (billingAddressId) {
            const address = user.address.find((addr: any) => addr.id == billingAddressId || addr.id === billingAddressId);
            if (address) {
              billingAddress = cleanAddress(address);
              console.log('✅ Dirección de facturación obtenida del usuario:', { id: address.id, street: address.street, city: address.city });
            }
          }
          
          // SHIPPING ADDRESS desde usuario (solo si no es digital)
          if (!isDigitalOnly) {
            const shippingAddressId = payload.shipping_address_id || this.form.value.shipping_address_id;
            if (shippingAddressId) {
              const address = user.address.find((addr: any) => addr.id == shippingAddressId || addr.id === shippingAddressId);
              if (address) {
                shippingAddress = cleanAddress(address);
                console.log('✅ Dirección de envío obtenida del usuario:', { id: address.id, street: address.street, city: address.city });
              }
            }
          }
        }
        
        // PRIORIDAD 2: Intentar desde localStorage si no se encontraron
        if (!billingAddress && this.isBrowser) {
          const savedBilling = localStorage.getItem("selected_billing_address");
          if (savedBilling) {
            try {
              const savedAddr = JSON.parse(savedBilling);
              if (user?.address?.some((addr: any) => addr.id == savedAddr.id || addr.id === savedAddr.id)) {
                const address = user.address.find((addr: any) => addr.id == savedAddr.id || addr.id === savedAddr.id);
                if (address) {
                  billingAddress = cleanAddress(address);
                }
              }
            } catch (e) {
              console.error('Error parseando dirección guardada:', e);
            }
          }
        }
        
        if (!shippingAddress && !isDigitalOnly && this.isBrowser) {
          const savedShipping = localStorage.getItem("selected_shipping_address");
          if (savedShipping) {
            try {
              const savedAddr = JSON.parse(savedShipping);
              if (user?.address?.some((addr: any) => addr.id == savedAddr.id || addr.id === savedAddr.id)) {
                const address = user.address.find((addr: any) => addr.id == savedAddr.id || addr.id === savedAddr.id);
                if (address) {
                  shippingAddress = cleanAddress(address);
                }
              }
            } catch (e) {
              console.error('Error parseando dirección guardada:', e);
            }
          }
        }
        
        // PRIORIDAD 3: Usar la primera dirección del usuario si no se encontró ninguna
        if (!billingAddress && user?.address && user.address.length > 0) {
          billingAddress = cleanAddress(user.address[0]);
          console.log('⚠️ Usando primera dirección del usuario para facturación');
        }
        
        if (!shippingAddress && !isDigitalOnly && user?.address && user.address.length > 0) {
          shippingAddress = cleanAddress(user.address[0]);
          console.log('⚠️ Usando primera dirección del usuario para envío');
        }
        
        // Validar que billingAddress tenga los campos requeridos
        if (!billingAddress) {
          alert('Por favor selecciona una dirección de facturación.');
          this.loading = false;
          return;
        }
        
        if (!billingAddress.street || !billingAddress.city || !billingAddress.pincode) {
          console.error('❌ Dirección de facturación incompleta:', billingAddress);
          alert('La dirección de facturación está incompleta. Por favor verifica que tenga calle, ciudad y código postal.');
          this.loading = false;
          return;
        }
        
        // Para productos digitales, usar billingAddress como shippingAddress si no hay una específica
        if (isDigitalOnly && !shippingAddress) {
          shippingAddress = { ...billingAddress };
          console.log('⚠️ Producto digital: usando dirección de facturación como dirección de envío');
        }
        
        // Validar que shippingAddress tenga los campos requeridos
        if (!shippingAddress) {
          alert('Por favor selecciona una dirección de envío.');
          this.loading = false;
          return;
        }
        
        if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.pincode) {
          console.error('❌ Dirección de envío incompleta:', shippingAddress);
          alert('La dirección de envío está incompleta. Por favor verifica que tenga calle, ciudad y código postal.');
          this.loading = false;
          return;
        }
        
        console.log('📍 Direcciones finales antes de construir payload:', {
          shipping: shippingAddress ? '✅ Presente' : '❌ Faltante',
          billing: billingAddress ? '✅ Presente' : '❌ Faltante',
          isDigitalOnly,
          shippingStreet: shippingAddress?.street,
          billingStreet: billingAddress?.street
        });

        // Preparar los datos que el back necesita para crear PendingOrder
        const widgetRequestBody = {
          products: payload.products,
          shipping_address: shippingAddress,
          billing_address: billingAddress,
          shipping_cost: payload.shipping_total,
          tax_amount: payload.tax_total,
          discount_amount: 0,
          subtotal: payload.total - payload.tax_total - payload.shipping_total,
          total: payload.total,
          coupon: payload.coupon,
          delivery_description: payload.delivery_description,
          delivery_interval: payload.delivery_interval,
          notes: '',
          points_amount: payload.points_amount,
          wallet_balance: payload.wallet_balance
        };

        // IMPORTANTE: El backend debe validar antes de crear la orden pendiente
        // Si getWidgetData falla, significa que hay un error y NO se crea la orden pendiente
        // Solo después del pago exitoso se crea la orden final
        this.wompiService.getWidgetData(widgetRequestBody).subscribe({
              next: (response) => {

            if (response.success && response.data) {
              const d = response.data;

              // Guardar la orden temporal en localStorage usando la reference del back
              if (this.isBrowser && this.pendingCheckoutPayload) {
                const orderData = {
                  ...this.pendingCheckoutPayload,
                  reference: d.reference,
                  timestamp: new Date().getTime()
                };
                localStorage.setItem(`temp_order_${d.reference}`, JSON.stringify(orderData));
              }

              // Validar que tenemos todos los datos necesarios
              if (!d.signatureIntegrity) {
                alert('Error: No se recibió la firma de integridad. Por favor contacte a soporte.');
                this.loading = false;
                return;
              }

              if (!d.reference) {
                alert('Error: No se recibió la referencia de la orden. Por favor contacte a soporte.');
                this.loading = false;
                return;
              }

              // Validar que tenemos la llave pública del backend
              if (!d.publicKey) {
                alert('Error: No se recibió la llave pública. Por favor contacte a soporte.');
                this.loading = false;
                return;
              }

              // Configurar el widget con los datos recibidos del backend
              // Configuración del widget sin expirationTime
              // ❌ NO ENVIAR redirect-url mientras estás en localhost para pruebas
              this.wompiWidgetConfig = {
                publicKey: d.publicKey,
                currency: d.currency || 'COP',
                amountInCents: Number(d.amountInCents),
                reference: d.reference,
                signatureIntegrity: d.signatureIntegrity,
                // redirectUrl: d.redirectUrl, // Comentado para pruebas en localhost
                // Para pruebas con redirect HTTPS válido de Wompi, usa:
                // redirectUrl: 'https://transaction-redirect.wompi.co/check',
                env: d.publicKey?.includes("test") ? "test" : undefined,
              };

              // 🔍 LOGS PARA COMPARAR FIRMA DEL BACKEND VS WIDGET
              console.log('🔐 === COMPARACIÓN DE FIRMAS ===');
              console.log('📥 FIRMA RECIBIDA DEL BACKEND:');
              console.log({
                signature: d.signatureIntegrity,
                signatureLength: d.signatureIntegrity?.length,
                signaturePreview: d.signatureIntegrity?.substring(0, 20) + '...' + d.signatureIntegrity?.substring(d.signatureIntegrity.length - 10)
              });
              console.log('📤 DATOS QUE SE ENVIAN AL WIDGET:');
              console.log({
                reference: d.reference,
                referenceLength: d.reference?.length,
                amountInCents: d.amountInCents,
                amountInCentsLength: String(d.amountInCents)?.length,
                currency: d.currency,
                currencyLength: d.currency?.length,
                expirationTime: d.expirationTime,
                expirationTimeLength: d.expirationTime?.length,
                signature: d.signatureIntegrity?.substring(0, 20) + '...' + d.signatureIntegrity?.substring(d.signatureIntegrity.length - 10),
                signatureLength: d.signatureIntegrity?.length
              });
              
              // Construir el string exacto que el widget enviará (según documentación Wompi)
              // Formato: Reference + Amount + Currency (SIN expirationTime)
              const referencePart = d.reference || '';
              const amountPart = String(d.amountInCents || '');
              const currencyPart = d.currency || 'COP';
              
              // String que el BACKEND debería estar usando para generar la firma
              // Formato: Reference + Amount + Currency + SecretoIntegridad
              const backendExpectedString = `${referencePart}${amountPart}${currencyPart}`;
              
              console.log('🔗 ANÁLISIS DEL STRING PARA LA FIRMA:');
              console.log('📋 Partes individuales (para contar caracteres):');
              console.log({
                'reference': `"${referencePart}" (${referencePart.length} chars)`,
                'amountInCents': `"${amountPart}" (${amountPart.length} chars)`,
                'currency': `"${currencyPart}" (${currencyPart.length} chars)`
              });
              
              console.log('🔗 STRING COMPLETO (sin secreto) que el BACKEND debería usar:');
              console.log({
                string: backendExpectedString,
                stringLength: backendExpectedString.length,
                stringPreview: backendExpectedString.substring(0, Math.min(80, backendExpectedString.length)) + (backendExpectedString.length > 80 ? '...' : ''),
                fullString: backendExpectedString // String completo para copiar y comparar
              });
              
              // Mostrar cada carácter para detectar espacios o caracteres invisibles
              console.log('🔍 CARACTERES INDIVIDUALES (para detectar espacios/extra):');
              const charArray = Array.from(backendExpectedString);
              console.log({
                totalChars: charArray.length,
                first50: charArray.slice(0, 50).map((char, idx) => `${idx}: "${char}" (${char.charCodeAt(0)})`),
                last15: charArray.slice(-15).map((char, idx) => `${charArray.length - 15 + idx}: "${char}" (${char.charCodeAt(0)})`)
              });
              
              console.log('🔐 === FIN COMPARACIÓN ===');

              this.showWompiWidget = true;
              this.loading = false;
            } else {
              this.loading = false;
              alert('Error al obtener los datos del widget. Por favor contacte a soporte.');
            }
          },
          error: (err) => {
            // Si hay error al obtener el widget, NO se crea la orden pendiente
            // Esto previene que se creen órdenes pendientes si hay errores
            this.loading = false;
            const errorMessage = err?.error?.message || err?.message || 'Error desconocido';
            alert(`No se puede procesar el pedido. Por favor verifica los datos e intenta nuevamente.\n\nError: ${errorMessage}`);
            console.error('Error al obtener datos del widget de Wompi (no se creó orden pendiente):', err);
          }
        });
      }
    } else {
      // Si el formulario no es válido, marcar todos los campos como touched para mostrar errores
      Object.keys(this.form.controls).forEach(key => {
        const control = this.form.get(key);
        if (control) {
          if (control instanceof FormGroup) {
            Object.keys(control.controls).forEach(subKey => {
              control.get(subKey)?.markAsTouched();
            });
          } else {
            control.markAsTouched();
          }
        }
      });
      alert('Por favor, completa todos los campos requeridos antes de realizar el pedido.');
    }
  }

  clearCart() {
    this.store.dispatch(new ClearCart());
  }

  cancelWompiWidget() {
    const hadWidget = this.showWompiWidget;
    this.showWompiWidget = false;
    this.wompiWidgetConfig = null;
    this.pendingCheckoutPayload = null;
    if (hadWidget) {
      this.cleanupPendingCheckout();
    }
  }

  openWarningModal(title: string, message: string) {
    const modalRef = this.modal.open(WarningModalComponent, {
      centered: true,
      windowClass: 'theme-modal-2',
      backdrop: 'static',
      keyboard: false
    });
    modalRef.componentInstance.title = title;
    modalRef.componentInstance.message = message;
  }

  onWompiWidgetEvent(event: any) {
    console.log('🎯 Evento recibido de Wompi:', event);
    const status = event?.transaction?.status || event?.status;
    const transactionId = event?.transactionId || 
                         event?.transaction?.id || 
                         event?.transaction?.idempotency_key || 
                         event?.transaction?.transaction_id ||
                         event?.id;

    console.log('🔍 Información extraída:', { status, transactionId, fullEvent: event });

    // Verificar si ya se procesó este transactionId
    if (transactionId && this.processedTransactionIds.has(transactionId)) {
      console.warn('⚠️ Este transactionId ya fue procesado, ignorando evento duplicado:', transactionId);
      return;
    }

    // Si el status es APPROVED o si hay transactionId (asumir éxito si llegó aquí)
    if ((status === 'APPROVED' || !status) && transactionId) {
      console.log('✅ Procesando pago aprobado con transactionId:', transactionId);
      console.log('📋 Payload disponible:', !!this.pendingCheckoutPayload);
      console.log('📋 localStorage pending_checkout:', this.isBrowser ? !!localStorage.getItem('pending_checkout') : 'N/A');
      
      // Cerrar el widget de Wompi primero
      this.showWompiWidget = false;
      this.wompiWidgetConfig = null;
      
      // Procesar la orden después del pago exitoso
      // NO marcar el transactionId aquí, se marcará después de procesar exitosamente
      this.processOrderAfterWompi(transactionId);
    } else if (status === 'DECLINED') {
      this.cancelWompiWidget();
      this.openWarningModal('Pago Rechazado', 'El pago fue rechazado. Por favor intenta nuevamente o utiliza otro método de pago.');
    } else if (status === 'VOIDED') {
      this.cancelWompiWidget();
      this.openWarningModal('Pago Anulado', 'El pago fue anulado. Si fue un error, intenta nuevamente.');
    } else {
      console.warn('⚠️ Evento de Wompi sin status o transactionId claro:', { status, transactionId });
    }
  }

  private processOrderAfterWompi(transactionId: string) {
    // Protección: evitar procesar múltiples veces
    if (this.isProcessingOrder) {
      console.warn('⚠️ Ya se está procesando una orden, ignorando solicitud duplicada para transactionId:', transactionId);
      return;
    }

    // Verificar si ya se procesó este transactionId
    if (this.processedTransactionIds.has(transactionId)) {
      console.warn('⚠️ Este transactionId ya fue procesado:', transactionId);
      return;
    }

    // Marcar como procesando y marcar el transactionId como procesado
    this.isProcessingOrder = true;
    this.processedTransactionIds.add(transactionId);

    // Obtener la referencia de la orden pendiente
    let reference: string | null = null;
    
    // Intentar obtener la referencia del pendingCheckoutPayload
    if (this.pendingCheckoutPayload?.reference) {
      reference = this.pendingCheckoutPayload.reference;
    }
    
    // Si no está en pendingCheckoutPayload, buscar en localStorage
    if (!reference && this.isBrowser) {
      // Buscar en temp_order_* keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('temp_order_')) {
          try {
            const orderData = JSON.parse(localStorage.getItem(key) || '{}');
            if (orderData.reference) {
              reference = orderData.reference;
              break;
            }
          } catch (error) {
            // Continuar buscando
          }
        }
      }
      
      // Si aún no se encontró, intentar desde wompiWidgetConfig
      if (!reference && this.wompiWidgetConfig?.reference) {
        reference = this.wompiWidgetConfig.reference;
      }
    }

    if (!reference) {
      console.error('❌ No se encontró la referencia de la orden pendiente');
      this.isProcessingOrder = false; // Resetear bandera
      this.openWarningModal('Error de Pedido', 'No se encontró la información del pedido. Por favor contacta a soporte.');
      this.cancelWompiWidget();
      return;
    }

    console.log('✅ Pago confirmado exitosamente por Wompi. TransactionId:', transactionId);
    console.log('ℹ️ No es necesario llamar a API adicional - Wompi ya confirmó el pago');

    this.loading = true;
    
    // Mostrar loading brevemente para dar tiempo al backend/webhook de procesar
    setTimeout(() => {
      this.loading = false;
      this.isProcessingOrder = false;
      
      // Limpiar datos
      this.cleanupPendingCheckout();
      this.showWompiWidget = false;
      this.wompiWidgetConfig = null;
      this.pendingCheckoutPayload = null;

      // Limpiar datos temporales de localStorage
      if (this.isBrowser) {
        // Limpiar todas las claves temp_order_*
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.startsWith('temp_order_')) {
            localStorage.removeItem(key);
          }
        }
        localStorage.removeItem('pending_checkout');
      }

      // Limpiar el carrito después del pago exitoso
      this.store.dispatch(new ClearCart());

      // Mostrar modal de éxito directamente - el pago ya fue confirmado por Wompi
      console.log('✅ Abriendo modal de éxito. TransactionId:', transactionId);
      const modalRef = this.modal.open(OrderSuccessModalComponent, {
        centered: true,
        windowClass: 'theme-modal-2',
        backdrop: 'static',
        keyboard: false
      });
      console.log('✅ Modal de éxito mostrado');
    }, 1000); // Esperar 1 segundo para dar tiempo al backend/webhook
  }

  private cleanupPendingCheckout() {
    if (!this.isBrowser) return;
    localStorage.removeItem('pending_checkout');
    localStorage.removeItem('wompi_payment_link_id');
  }

  openModal() {
    this.modal.open(AddressModalComponent, {
      centered: true,
      windowClass: "theme-modal-2",
    });
  }

  couponModal() {
    this.modal.open(CouponModalComponent, {
      centered: true,
      windowClass: "theme-modal-2 coupon-modal",
      size: "lg",
    });
  }

  copyFunction(txt: string): void {
    navigator.clipboard.writeText(txt);
  }

  openModalLogin(): void {
    // Activar el flag para mostrar el modal de login
    this.authService.isLogin = true;
  }

  onPlaceOrderClick(): void {
    this.placeorder();
  }

  isPlaceOrderEnabled(): boolean {
    // El botón siempre está habilitado (no gris)
    // La verificación de autenticación se hace en placeorder()
    return true;
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      this.form.reset();
    }
  }
}
