import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { Subject, takeUntil } from "rxjs";
import { SharedTimeRangeService } from "../shared-time-range.service";

@Component({
  selector: "app-line-slider",
  templateUrl: "./line-slider.component.html",
  styleUrls: ["./line-slider.component.scss"],
})
export class LineSliderComponent implements OnInit {
  public formLineSlider!: FormGroup;
  public ticks = Array.from({ length: 10 }, (_, i) => i + 1);

  private unsubscribe$ = new Subject<void>();

  get selelectedValue() {
    return this.formLineSlider.get("selectedValue");
  }

  constructor(fb: FormBuilder, private sharedService: SharedTimeRangeService) {
    this.formLineSlider = fb.group({
      selectedValue: 0,
    });
  }

  ngOnInit(): void {
    this.selelectedValue?.valueChanges
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((value: any) => {
        console.log("Valor seleccionado:", value);
        this.sharedService.changeMessage(value);
      });

    this.sharedService.currentMessage
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((message: string) => {
        // Update the selected value only if it differs from the received message
        if (this.selelectedValue?.value !== message) {
          this.selelectedValue?.setValue(message);
        }
        console.log("Message received in TimeLineComponent:", message);
      });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
