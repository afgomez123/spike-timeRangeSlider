import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class SharedTimeRangeService {
  private messageSource = new BehaviorSubject<string>(""); // Puede ser cualquier tipo de dato por el momento sera vacio
  public currentMessage = this.messageSource.asObservable();

  // Método para actualizar el mensaje
  public changeMessage(message: string) {
    this.messageSource.next(message);
  }
}
