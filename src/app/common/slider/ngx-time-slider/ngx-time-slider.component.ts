import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { Options, LabelType } from '@angular-slider/ngx-slider';

@Component({
  selector: 'app-ngx-time-slider',
  templateUrl: './ngx-time-slider.component.html',
  styleUrls: ['./ngx-time-slider.component.scss']
})
export class NgxTimeSliderComponent implements AfterViewInit {

  value: number = 7;
  highValue: number = 7.5;
  isInitialized = false;

  @ViewChild('label', { static: false }) labelRef!: ElementRef;
  @ViewChild('slider', { static: false }) sliderRef!: ElementRef;

  preselectedRanges = [
    { startTime: '07:10', endTime: '07:15' },
    { startTime: '07:45', endTime: '08:00' },
    { startTime: '08:15', endTime: '08:30' }
  ];

  options: Options = {
    floor: 7,
    ceil: 11,
    step: 1 / 60,
    draggableRange: true,
    translate: (value: number, label: LabelType): string => {
      const totalMinutes = Math.round((value - 7) * 60);
      return `${totalMinutes}m`;
    }
  };

  ngAfterViewInit() {
    this.isInitialized = true;
    // this.updateLabelPosition();
  }

  checkRangeValidity() {
    const isInRange = this.isWithinPreselectedRange();
    if (isInRange) {
      //alert('Rango permitido');
      console.log('Rango permitido');
    } else {
      console.log('Rango no permitido');
      //alert('Rango no permitido');
    }
}

isWithinPreselectedRange(): boolean {
  const startMinutes = Math.round((this.value - 7) * 60);
  const endMinutes = Math.round((this.highValue - 7) * 60);

  return this.preselectedRanges.some(range => {
    const rangeStart = this.convertTimeToDecimal(range.startTime) * 60;
    const rangeEnd = this.convertTimeToDecimal(range.endTime) * 60;

    // console.log('startMinutes', startMinutes);
    // console.log('endMinutes', endMinutes);
    // console.log('rangeStart', rangeStart);
    // console.log('rangeEnd', rangeEnd);

    // Verificar si cualquier parte del rango seleccionado cae dentro de un rango permitido
    return (startMinutes >= rangeStart);

  });
}

  updateLabelPosition() {
    if (!this.isInitialized || !this.sliderRef || !this.labelRef) return;

    const sliderElement = this.sliderRef.nativeElement.querySelector('.ngx-slider-pointer');
    if (!sliderElement) return;

    const sliderPosition = sliderElement.getBoundingClientRect();
    const sliderContainer = this.sliderRef.nativeElement.getBoundingClientRect();

    const labelLeftPosition = sliderPosition.left - sliderContainer.left + (sliderPosition.width / 2) - (this.labelRef.nativeElement.offsetWidth / 2);
    this.labelRef.nativeElement.style.left = `${labelLeftPosition}px`;
  }

  calculateRangeInMinutes(): number {
    const startMinutes = Math.round((this.value - 7) * 60);
    const endMinutes = Math.round((this.highValue - 7) * 60);
    return endMinutes - startMinutes;
  }

  getSliderBackground() {
    let background = 'to right, #e6e6e6 0%';
    const sortedRanges = this.preselectedRanges.map(range => ({
      start: this.convertTimeToDecimal(range.startTime),
      end: this.convertTimeToDecimal(range.endTime)
    })).sort((a, b) => a.start - b.start);

    let lastEndPercentage = 0;
    sortedRanges.forEach(range => {
      const startPercentage = ((range.start - 7) / (11 - 7)) * 100;
      const endPercentage = ((range.end - 7) / (11 - 7)) * 100;
      if (startPercentage > lastEndPercentage) {
        background += `, #e6e6e6 ${lastEndPercentage}% ${startPercentage}%`;
      }
      background += `, #b3d7ff ${startPercentage}% ${endPercentage}%`;
      lastEndPercentage = endPercentage;
    });
    if (lastEndPercentage < 100) {
      background += `, #e6e6e6 ${lastEndPercentage}% 100%`;
    }
    return `linear-gradient(${background})`;
  }

  convertTimeToDecimal(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours + minutes / 60;
  }
}
