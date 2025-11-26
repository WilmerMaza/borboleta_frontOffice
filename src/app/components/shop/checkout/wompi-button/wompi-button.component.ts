import { Component, Input, AfterViewInit, OnChanges, SimpleChanges, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface WompiButtonConfig {
  publicKey: string;
  amountInCents: number;
  reference: string;
  currency: string;
  signature: string;
  redirectUrl?: string;
  expirationTime?: string;
  env?: 'test' | 'production';
}

@Component({
  selector: 'app-wompi-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wompi-button.component.html',
  styleUrl: './wompi-button.component.scss'
})
export class WompiButtonComponent implements AfterViewInit, OnChanges {
  @ViewChild('wompiForm', { static: false }) wompiForm!: ElementRef<HTMLFormElement>;
  
  @Input() config: WompiButtonConfig | null = null;

  private scriptElement: HTMLScriptElement | null = null;

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
      this.config.signature
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
    this.scriptElement = this.renderer.createElement('script');
    this.renderer.setAttribute(this.scriptElement, 'src', 'https://checkout.wompi.co/widget.js');
    this.renderer.setAttribute(this.scriptElement, 'data-render', 'button');
    this.renderer.setAttribute(this.scriptElement, 'data-public-key', this.config.publicKey);
    this.renderer.setAttribute(this.scriptElement, 'data-currency', this.config.currency);
    this.renderer.setAttribute(this.scriptElement, 'data-amount-in-cents', String(this.config.amountInCents));
    this.renderer.setAttribute(this.scriptElement, 'data-reference', this.config.reference);
    
    // ✅ IMPORTANTE: Según la documentación oficial, debe ser data-signature:integrity (con dos puntos)
    this.renderer.setAttribute(this.scriptElement, 'data-signature:integrity', this.config.signature);
    
    if (this.config.redirectUrl) {
      this.renderer.setAttribute(this.scriptElement, 'data-redirect-url', this.config.redirectUrl);
    }

    if (this.config.expirationTime) {
      this.renderer.setAttribute(this.scriptElement, 'data-expiration-time', this.config.expirationTime);
    }

    // Agregar el script al formulario
    this.renderer.appendChild(formElement, this.scriptElement);
  }
}

