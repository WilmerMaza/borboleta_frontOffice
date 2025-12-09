import { Component, Input, Output, EventEmitter, AfterViewInit, OnChanges, SimpleChanges, ViewChild, ElementRef, Renderer2, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface WompiButtonConfig {
  publicKey: string;
  amountInCents: number;
  reference: string;
  currency: string;
  signatureIntegrity: string;
  redirectUrl?: string;
  env?: 'test' | 'production';
}

@Component({
  selector: 'app-wompi-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wompi-button.component.html',
  styleUrl: './wompi-button.component.scss'
})
export class WompiButtonComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('wompiForm', { static: false }) wompiForm!: ElementRef<HTMLFormElement>;
  
  @Input() config: WompiButtonConfig | null = null;
  @Output() paymentEvent = new EventEmitter<any>();

  private scriptElement: HTMLScriptElement | null = null;
  private wompiCallbacks: any = {};
  private messageListener?: (event: MessageEvent) => void;

  constructor(private renderer: Renderer2) {}

  ngAfterViewInit() {
    if (this.config && this.shouldRender()) {
      this.renderButton();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    // Si cambia la config, re-renderizar
    if (changes['config'] && this.wompiForm && this.shouldRender()) {
      this.renderButton();
    }
  }

  private shouldRender(): boolean {
    return !!(
      this.config &&
      this.config.publicKey &&
      this.config.amountInCents &&
      this.config.reference &&
      this.config.currency &&
      this.config.signatureIntegrity
    );
  }

  private renderButton() {
    if (!this.wompiForm || !this.config || !this.shouldRender()) {
      return;
    }

    const formElement = this.wompiForm.nativeElement;
    
    // Limpiar script anterior si existe
    if (this.scriptElement) {
      this.renderer.removeChild(formElement, this.scriptElement);
      this.scriptElement = null;
    }

    // Limpiar el formulario antes de agregar el nuevo script
    while (formElement.firstChild) {
      this.renderer.removeChild(formElement, formElement.firstChild);
    }

    // Crear el script según la documentación oficial de Wompi
    const scriptElement = this.renderer.createElement('script');
    this.scriptElement = scriptElement;
    
    scriptElement.src = 'https://checkout.wompi.co/widget.js';
    this.renderer.setAttribute(scriptElement, 'data-render', 'button');
    this.renderer.setAttribute(scriptElement, 'data-public-key', this.config.publicKey);
    this.renderer.setAttribute(scriptElement, 'data-currency', this.config.currency);
    this.renderer.setAttribute(scriptElement, 'data-amount-in-cents', String(this.config.amountInCents));
    this.renderer.setAttribute(scriptElement, 'data-reference', this.config.reference);
    
    // ✅ Según la documentación oficial de Wompi: https://docs.wompi.co/docs/colombia/widget-checkout-web/
    // El atributo HTML debe ser "data-signature:integrity" (con dos puntos)
    scriptElement.setAttribute('data-signature:integrity', this.config.signatureIntegrity);
    
    if (this.config.redirectUrl) {
      this.renderer.setAttribute(scriptElement, 'data-redirect-url', this.config.redirectUrl);
    }

    // Configurar callbacks globales de Wompi ANTES de agregar el script
    this.setupWompiCallbacks();

    // Agregar el script al formulario
    this.renderer.appendChild(formElement, this.scriptElement);
    
    // 🔍 LOGS PARA VERIFICAR LOS ATRIBUTOS CONFIGURADOS
    setTimeout(() => {
      if (!this.config) return;
      
      const signature = this.config.signatureIntegrity || '';
      const signaturePreview = signature.length > 30 
        ? signature.substring(0, 20) + '...' + signature.substring(signature.length - 10)
        : signature;
      
      console.log('🔐 === ATRIBUTOS CONFIGURADOS EN EL WIDGET DE WOMPI ===');
      console.log('📋 Configuración recibida:', {
        reference: this.config.reference,
        amountInCents: this.config.amountInCents,
        currency: this.config.currency,
        signatureLength: signature.length,
        signaturePreview: signaturePreview
      });
      
      const sigAttr = scriptElement.getAttribute('data-signature:integrity');
      const refAttr = scriptElement.getAttribute('data-reference');
      const amountAttr = scriptElement.getAttribute('data-amount-in-cents');
      const currencyAttr = scriptElement.getAttribute('data-currency');
      
      console.log('📋 Atributos HTML configurados en el script:', {
        'data-render': scriptElement.getAttribute('data-render'),
        'data-public-key': scriptElement.getAttribute('data-public-key')?.substring(0, 20) + '...',
        'data-currency': currencyAttr,
        'data-amount-in-cents': amountAttr,
        'data-reference': refAttr,
        'data-signature:integrity': sigAttr ? `✅ Presente (${sigAttr.length} chars)` : '❌ Faltante',
        'data-redirect-url': scriptElement.getAttribute('data-redirect-url')
      });
      
      // Construir el string que el widget enviará a Wompi (sin expirationTime)
      if (refAttr && amountAttr && currencyAttr) {
        const widgetString = `${refAttr}${amountAttr}${currencyAttr}`;
        
        console.log('🔗 STRING QUE EL WIDGET ENVIARÁ A WOMPI (para comparar con backend):');
        console.log('📋 Partes individuales:');
        console.log({
          'reference': `"${refAttr}" (${refAttr.length} chars)`,
          'amountInCents': `"${amountAttr}" (${amountAttr.length} chars)`,
          'currency': `"${currencyAttr}" (${currencyAttr.length} chars)`
        });
        
        console.log('🔗 STRING COMPLETO que el widget enviará:');
        console.log({
          string: widgetString,
          stringLength: widgetString.length,
          stringPreview: widgetString.substring(0, Math.min(80, widgetString.length)) + (widgetString.length > 80 ? '...' : ''),
          fullString: widgetString // String completo para copiar y comparar
        });
        
        // Mostrar cada carácter para detectar espacios o caracteres invisibles
        console.log('🔍 CARACTERES INDIVIDUALES del string del widget:');
        const charArray = Array.from(widgetString);
        console.log({
          totalChars: charArray.length,
          first50: charArray.slice(0, 50).map((char, idx) => `${idx}: "${char}" (${char.charCodeAt(0)})`),
          last15: charArray.slice(-15).map((char, idx) => `${charArray.length - 15 + idx}: "${char}" (${char.charCodeAt(0)})`)
        });
      }
      
      console.log('🔐 === FIN VERIFICACIÓN DE ATRIBUTOS ===');
    }, 200);
  }

  private setupWompiCallbacks() {
    // Limpiar callbacks anteriores si existen
    this.cleanupWompiCallbacks();

    // Configurar callbacks globales de Wompi
    if (typeof window !== 'undefined') {
      // Callback cuando el pago es aceptado
      (window as any).WompiWidget = (window as any).WompiWidget || {};
      (window as any).WompiWidget.onAccept = (transaction: any) => {
        console.log('✅ Wompi: Pago aceptado (onAccept callback)', transaction);
        this.paymentEvent.emit({
          transaction: transaction,
          status: 'APPROVED'
        });
      };

      // Callback cuando el pago es rechazado
      (window as any).WompiWidget.onReject = (transaction: any) => {
        console.log('❌ Wompi: Pago rechazado (onReject callback)', transaction);
        this.paymentEvent.emit({
          transaction: transaction,
          status: 'DECLINED'
        });
      };

      // También escuchar eventos postMessage por si Wompi usa iframe
      this.messageListener = (event: MessageEvent) => {
        // Verificar que el mensaje sea de Wompi
        const wompiOrigins = [
          'https://checkout.wompi.co',
          'https://production.wompi.co',
          'https://api.wompi.co',
          'https://checkout.wompi.sv'
        ];
        
        if (!wompiOrigins.some(origin => event.origin.includes('wompi'))) {
          return;
        }

        console.log('📨 Mensaje recibido de Wompi:', event.data);
        
        // Manejar el evento 'finishpayment' que es cuando se completa el pago
        const data = event.data;
        if (data && data.event === 'finishpayment') {
          const paymentData = data.data || data;
          
          // Extraer información de la transacción
          // El formato puede variar, intentar diferentes estructuras
          const transaction = paymentData?.transaction || paymentData?.data || paymentData;
          const status = transaction?.status || paymentData?.status || transaction?.state;
          const transactionId = transaction?.id || transaction?.transaction_id || paymentData?.id || paymentData?.transaction_id;
          
          console.log('💳 Wompi: Pago finalizado', { 
            status, 
            transactionId,
            transaction, 
            paymentData,
            fullData: data
          });
          
          // Si el status es APPROVED o APPROVED_BY_NETWORK, emitir evento de éxito
          if (status === 'APPROVED' || status === 'APPROVED_BY_NETWORK' || status === 'approved') {
            console.log('✅ Wompi: Pago aceptado (finishpayment)', { transactionId, transaction });
            this.paymentEvent.emit({
              transaction: {
                ...transaction,
                id: transactionId || transaction?.id,
                status: 'APPROVED'
              },
              status: 'APPROVED',
              transactionId: transactionId
            });
          } 
          // Si el status es DECLINED, REJECTED o VOIDED, emitir evento de rechazo
          else if (status === 'DECLINED' || status === 'REJECTED' || status === 'VOIDED' || 
                   status === 'declined' || status === 'rejected' || status === 'voided') {
            console.log('❌ Wompi: Pago rechazado (finishpayment)', { transactionId, transaction });
            this.paymentEvent.emit({
              transaction: {
                ...transaction,
                id: transactionId || transaction?.id,
                status: 'DECLINED'
              },
              status: 'DECLINED',
              transactionId: transactionId
            });
          }
          // Si no hay status pero hay transactionId, asumir que fue exitoso
          else if (transactionId) {
            console.log('⚠️ Wompi: Pago finalizado sin status claro, asumiendo éxito', { transactionId });
            this.paymentEvent.emit({
              transaction: {
                ...transaction,
                id: transactionId,
                status: 'APPROVED'
              },
              status: 'APPROVED',
              transactionId: transactionId
            });
          }
        }
        // También manejar otros formatos de mensaje
        else if (data && (data.type === 'wompi:transaction' || data.transaction)) {
          const transaction = data.transaction || data;
          const status = transaction?.status || data?.status;
          
          if (status === 'APPROVED') {
            console.log('✅ Wompi: Pago aceptado (postMessage)', transaction);
            this.paymentEvent.emit({
              transaction: transaction,
              status: 'APPROVED'
            });
          } else if (status === 'DECLINED' || status === 'REJECTED') {
            console.log('❌ Wompi: Pago rechazado (postMessage)', transaction);
            this.paymentEvent.emit({
              transaction: transaction,
              status: 'DECLINED'
            });
          }
        }
      };

      window.addEventListener('message', this.messageListener);
    }
  }

  private cleanupWompiCallbacks() {
    if (typeof window !== 'undefined') {
      if ((window as any).WompiWidget) {
        // Limpiar callbacks anteriores
        delete (window as any).WompiWidget.onAccept;
        delete (window as any).WompiWidget.onReject;
      }
      
      // Remover listener de mensajes
      if (this.messageListener) {
        window.removeEventListener('message', this.messageListener);
        this.messageListener = undefined;
      }
    }
    this.wompiCallbacks = {};
  }

  ngOnDestroy() {
    this.cleanupWompiCallbacks();
  }
}

