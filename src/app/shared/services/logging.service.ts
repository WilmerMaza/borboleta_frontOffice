import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoggingService {

  constructor() { }

  logError(message: string) {
    // Log errors silently without console output
    // You can implement proper logging here (e.g., send to external service)
  }
}
