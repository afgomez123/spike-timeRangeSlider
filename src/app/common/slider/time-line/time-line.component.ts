import {
  Component,
  ElementRef,
  Input,
  OnInit,
  Renderer2,
  ViewChild,
  AfterViewInit,
  HostListener,
} from '@angular/core';

interface TimeRange {
  startTime: string;
  endTime: string;
  left?: string;
  width?: string;
}

@Component({
  selector: 'app-time-line',
  templateUrl: './time-line.component.html',
  styleUrls: ['./time-line.component.scss']
})
export class TimeLineComponent implements AfterViewInit, OnInit {
  @Input() startHour: number = 8; // Hora de inicio configurable
  @Input() endHour: number = 9; // Hora final configurable
  @Input() interval: number = 5; // Intervalo en minutos configurable
  @Input() timeRanges: TimeRange[] = []; // Rango de tiempo como Input

  @ViewChild('selectionBox') selectionBox!: ElementRef;
  @ViewChild('durationLabel') durationLabel!: ElementRef;
  @ViewChild('timelineTrack') timelineTrack!: ElementRef;

  isDragging = false;
  isResizing = false;
  startX!: number;
  startWidth!: number;
  startLeft!: number;
  isLeftHandle = false;
  isRangeAvailable = true;

  hours: string[] = [];

  constructor(private renderer: Renderer2) {}

  ngOnInit() {
    this.generateHoursRange(); // Usa las propiedades configurables
  }

  ngAfterViewInit() {
    this.setupDragAndResizeEvents();
    this.calculateTimeBlockPositions(); // Calcula posiciones con los bloques recibidos
    // setTimeout(() => {
      this.setInitialSelectionBoxPosition();// inactiva provision

    // }, 2000);
  }

  private setupDragAndResizeEvents() {
    // Evento para arrastrar
    this.renderer.listen(
      this.selectionBox.nativeElement,
      'mousedown',
      (e: MouseEvent) => {
        if ((e.target as HTMLElement).classList.contains('resize-handle')) {
          return; // Evitar arrastre si es desde una manija de redimensionado
        }
        this.isDragging = true;
        this.startX = e.pageX - this.selectionBox.nativeElement.offsetLeft;
      }
    );

    // Eventos para redimensionar desde las manijas
    this.selectionBox.nativeElement
      .querySelectorAll('.resize-handle')
      .forEach((handle: HTMLElement) => {
        this.renderer.listen(handle, 'mousedown', (e: MouseEvent) => {
          this.isResizing = true;
          this.startX = e.pageX;
          this.startWidth = this.selectionBox.nativeElement.offsetWidth;
          this.startLeft = this.selectionBox.nativeElement.offsetLeft;
          this.isLeftHandle = handle.classList.contains('left');
          e.stopPropagation();
        });
      });
  }

  private generateHoursRange() {
    const times: string[] = [];
    let currentHour = this.startHour;
    let currentMinute = 0;

    while (
      currentHour < this.endHour ||
      (currentHour === this.endHour && currentMinute === 0)
    ) {
      const formattedTime = `${this.padTime(currentHour)}:${this.padTime(
        currentMinute
      )}`;
      times.push(formattedTime);

      currentMinute += this.interval;
      if (currentMinute >= 60) {
        currentMinute = 0;
        currentHour++;
      }
    }

    this.hours = times;
  }

  /**
   * Pads a given number with leading zeros to ensure it has at least two digits.
   * @param value - The number to pad.
   * @returns The padded number as a string.
   */
  private padTime(value: number): string {
    return value.toString().padStart(2, '0');
  }

  /**
   * Converts a given time string in the format "HH:MM" to a pixel value
   * representing its position on a timeline.
   *
   * @param time - The time string to convert, in the format "HH:MM".
   * @returns The pixel value corresponding to the given time on the timeline.
   */
  private convertTimeToPixels(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    const startOfTimeline = this.startHour * 60; // Inicio dinámico del timeline
    const timelineWidth = this.timelineTrack.nativeElement.offsetWidth;
    const minutesInTimeline = (this.endHour - this.startHour) * 60; // Duración total en minutos

    return (
      ((totalMinutes - startOfTimeline) / minutesInTimeline) * timelineWidth
    );
  }

  /**
   * Calculates the positions of time blocks in pixels and updates the `timeRanges` array.
   * Each time range is mapped to an object containing its original properties along with
   * `left` and `width` properties, which represent the CSS pixel values for positioning
   * and sizing the time block.
   *
   * @returns {void}
   */
  calculateTimeBlockPositions(): void {
    this.timeRanges = this.timeRanges.map((range) => {
      const startPixels = this.convertTimeToPixels(range.startTime);
      const endPixels = this.convertTimeToPixels(range.endTime);
      const width = endPixels - startPixels;

      return { ...range, left: `${startPixels}px`, width: `${width}px` };
    });
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    if (this.isDragging) {
      this.moveBox(e);
    } else if (this.isResizing) {
      this.resizeBox(e);
    }
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    this.isDragging = false;
    this.isResizing = false;
  }

  /**
   * Handles the movement of the selection box within the timeline track.
   *
   * @param e - The MouseEvent triggered by the user's interaction.
   *
   * This method calculates the new position of the selection box based on the mouse event,
   * constrains it within the bounds of the timeline track, and updates the position of the
   * selection box and duration label accordingly. It also checks if the new range is available
   * and updates the visual indication of validity.
   */
  //v2
  private moveBox(e: MouseEvent) {
    const newPosition = e.pageX - this.startX;
    const maxLeft =
      this.timelineTrack.nativeElement.offsetWidth -
      this.selectionBox.nativeElement.offsetWidth;

    const constrainedPosition = Math.min(Math.max(newPosition, 0), maxLeft);

    this.isRangeAvailable = this.checkRangeAvailability(
      constrainedPosition,
      this.selectionBox.nativeElement.offsetWidth
    );

    this.selectionBox.nativeElement.style.left = `${constrainedPosition}px`;
    this.durationLabel.nativeElement.style.left = `${
      constrainedPosition + this.selectionBox.nativeElement.offsetWidth / 2 - 20
    }px`;

    this.updateDurationLabel();

    if (this.isRangeAvailable) {
      this.renderer.removeClass(this.selectionBox.nativeElement, 'invalid');
      this.selectionBox.nativeElement
        .querySelectorAll('.resize-handle')
        .forEach((handle: HTMLElement) => {
          this.renderer.removeClass(handle, 'invalid');
        });
    } else {
      this.renderer.addClass(this.selectionBox.nativeElement, 'invalid');
      this.selectionBox.nativeElement
        .querySelectorAll('.resize-handle')
        .forEach((handle: HTMLElement) => {
          this.renderer.addClass(handle, 'invalid');
        });
    }
}

  //v1
  // private moveBox(e: MouseEvent) {
  //   const newPosition = e.pageX - this.startX;
  //   const maxLeft =
  //     this.timelineTrack.nativeElement.offsetWidth -
  //     this.selectionBox.nativeElement.offsetWidth; //Le reste 5 para mejorar la precisión

  //   const constrainedPosition = Math.min(Math.max(newPosition, 0), maxLeft);

  //   // Verificar disponibilidad
  //   this.isRangeAvailable = this.checkRangeAvailability(
  //     constrainedPosition,
  //     this.selectionBox.nativeElement.offsetWidth
  //   );

  //   // Actualizar estilos
  //   this.selectionBox.nativeElement.style.left = `${constrainedPosition}px`;
  //   this.durationLabel.nativeElement.style.left = `${
  //     constrainedPosition + this.selectionBox.nativeElement.offsetWidth / 2 - 20
  //   }px`;

  //   // Actualizar duración
  //   this.updateDurationLabel();

  //   if (this.isRangeAvailable) {
  //     this.renderer.removeClass(this.selectionBox.nativeElement, 'invalid');
  //   } else {
  //     this.renderer.addClass(this.selectionBox.nativeElement, 'invalid');
  //   }
  // }

  /**
   * Handles the resizing of the selection box based on mouse events.
   *
   * @param e - The mouse event triggered during the resize action.
   *
   * This method adjusts the width and position of the selection box depending on whether the left handle is being dragged or not.
   * It ensures that the selection box does not exceed the boundaries of the timeline track.
   *
   * The method also checks the availability of the selected range and updates the duration label accordingly.
   * If the range is not available, it adds an 'invalid' class to the selection box.
   */


  //v3
  private resizeBox(e: MouseEvent) {
    const timelineWidth = this.timelineTrack.nativeElement.offsetWidth;
    const minutesInTimeline = (this.endHour - this.startHour) * 60;

    // Cálculo de los píxeles mínimos y máximos en función del intervalo de tiempo
    const minTime = 1; // Mínimo tiempo en minutos permitido
    const maxTime = 10; // Máximo tiempo en minutos permitido
    const minWidthInPixels = (minTime / minutesInTimeline) * timelineWidth;
    const maxWidthInPixels = (maxTime / minutesInTimeline) * timelineWidth;

    let newWidth: number;
    let newLeft: number;

    if (this.isLeftHandle) {
      const delta = this.startX - e.pageX;
      newWidth = Math.max(minWidthInPixels, Math.min(this.startWidth + delta, maxWidthInPixels));
      newLeft = Math.max(0, this.startLeft - delta);

      if (newLeft + newWidth <= this.timelineTrack.nativeElement.offsetWidth) {
        this.selectionBox.nativeElement.style.width = `${newWidth}px`;
        this.selectionBox.nativeElement.style.left = `${newLeft}px`;
      }
    } else {
      const delta = e.pageX - this.startX;
      newWidth = Math.max(minWidthInPixels, Math.min(this.startWidth + delta, maxWidthInPixels));
      newLeft = this.startLeft;

      if (
        this.startLeft + newWidth <=
        this.timelineTrack.nativeElement.offsetWidth
      ) {
        this.selectionBox.nativeElement.style.width = `${newWidth}px`;
      }
    }

    // Verificar disponibilidad y actualizar duración
    this.isRangeAvailable = this.checkRangeAvailability(newLeft, newWidth);
    this.durationLabel.nativeElement.style.left = `${
      newLeft + newWidth / 2 - 20
    }px`;
    this.updateDurationLabel();

    if (this.isRangeAvailable) {
      this.renderer.removeClass(this.selectionBox.nativeElement, 'invalid');
      this.selectionBox.nativeElement
        .querySelectorAll('.resize-handle')
        .forEach((handle: HTMLElement) => {
          this.renderer.removeClass(handle, 'invalid');
        });
    } else {
      this.renderer.addClass(this.selectionBox.nativeElement, 'invalid');
      this.selectionBox.nativeElement
        .querySelectorAll('.resize-handle')
        .forEach((handle: HTMLElement) => {
          this.renderer.addClass(handle, 'invalid');
        });
    }
}


  //v2
//   private resizeBox(e: MouseEvent) {
//     let newWidth: number;
//     let newLeft: number;

//     if (this.isLeftHandle) {
//       const delta = this.startX - e.pageX;
//       newWidth = Math.max(30, this.startWidth + delta);
//       newLeft = Math.max(0, this.startLeft - delta);

//       if (newLeft + newWidth <= this.timelineTrack.nativeElement.offsetWidth) {
//         this.selectionBox.nativeElement.style.width = `${newWidth}px`;
//         this.selectionBox.nativeElement.style.left = `${newLeft}px`;
//       }
//     } else {
//       const delta = e.pageX - this.startX;
//       newWidth = Math.max(30, this.startWidth + delta);
//       newLeft = this.startLeft;

//       if (
//         this.startLeft + newWidth <=
//         this.timelineTrack.nativeElement.offsetWidth
//       ) {
//         this.selectionBox.nativeElement.style.width = `${newWidth}px`;
//       }
//     }

//     this.isRangeAvailable = this.checkRangeAvailability(newLeft, newWidth);
//     this.durationLabel.nativeElement.style.left = `${
//       newLeft + newWidth / 2 - 20
//     }px`;
//     this.updateDurationLabel();

//     if (this.isRangeAvailable) {
//       this.renderer.removeClass(this.selectionBox.nativeElement, 'invalid');
//       this.selectionBox.nativeElement
//         .querySelectorAll('.resize-handle')
//         .forEach((handle: HTMLElement) => {
//           this.renderer.removeClass(handle, 'invalid');
//         });
//     } else {
//       this.renderer.addClass(this.selectionBox.nativeElement, 'invalid');
//       this.selectionBox.nativeElement
//         .querySelectorAll('.resize-handle')
//         .forEach((handle: HTMLElement) => {
//           this.renderer.addClass(handle, 'invalid');
//         });
//     }
// }


  //v1
  // resizeBox(e: MouseEvent) {
  //   let newWidth: number;
  //   let newLeft: number;

  //   if (this.isLeftHandle) {
  //     const delta = this.startX - e.pageX;
  //     newWidth = Math.max(30, this.startWidth + delta);
  //     newLeft = Math.max(0, this.startLeft - delta);

  //     if (newLeft + newWidth <= this.timelineTrack.nativeElement.offsetWidth) {
  //       this.selectionBox.nativeElement.style.width = `${newWidth}px`;
  //       this.selectionBox.nativeElement.style.left = `${newLeft}px`;
  //     }
  //   } else {
  //     const delta = e.pageX - this.startX;
  //     newWidth = Math.max(30, this.startWidth + delta);
  //     newLeft = this.startLeft;

  //     if (
  //       this.startLeft + newWidth <=
  //       this.timelineTrack.nativeElement.offsetWidth
  //     ) {
  //       this.selectionBox.nativeElement.style.width = `${newWidth}px`;
  //     }
  //   }

  //   // Verificar disponibilidad y actualizar duración
  //   this.isRangeAvailable = this.checkRangeAvailability(newLeft, newWidth);
  //   this.durationLabel.nativeElement.style.left = `${
  //     newLeft + newWidth / 2 - 20
  //   }px`;
  //   this.updateDurationLabel();

  //   if (this.isRangeAvailable) {
  //     this.renderer.removeClass(this.selectionBox.nativeElement, 'invalid');
  //   } else {
  //     this.renderer.addClass(this.selectionBox.nativeElement, 'invalid');
  //   }
  // }

  // Nueva
  private checkRangeAvailability(newLeft: number, width: number): boolean {
    const selectionStart = newLeft;
    const selectionEnd = newLeft + width;

    // Verificar si el cuadro de selección está completamente dentro de algún rango libre
    return this.timeRanges.some((range) => {
      const rangeStart = this.convertTimeToPixels(range.startTime);
      const rangeEnd = this.convertTimeToPixels(range.endTime);

      return selectionStart >= rangeStart && selectionEnd <= rangeEnd;
    });
  }

  calculateSelectedRange() {
    const selectionBox = this.selectionBox.nativeElement;
    const startPixels = selectionBox.offsetLeft;
    const endPixels = startPixels + selectionBox.offsetWidth;

    const startTime = this.convertPixelsToTime(startPixels);
    const endTime = this.convertPixelsToTime(endPixels);

    console.log({ startTime, endTime }); // Muestra el rango en la consola para verificar
  }

  // V1
  private convertPixelsToTime(pixels: number): string {
    const startOfTimeline = this.startHour * 60; // Inicio dinámico del timeline
    const timelineWidth = this.timelineTrack.nativeElement.offsetWidth;
    const minutesInTimeline = (this.endHour - this.startHour) * 60; // Duración total en minutos

    const totalMinutes =
      startOfTimeline + (pixels / timelineWidth) * minutesInTimeline;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);

    return `${this.padTime(hours)}:${this.padTime(minutes)}`;
  }



  //v3
  private setInitialSelectionBoxPosition() {
    if (this.timeRanges.length > 0) {
        const firstRange = this.timeRanges[0];

        const startPixels = this.convertTimeToPixels(firstRange.startTime);

        // Calcula el ancho en píxeles para 10 minutos y redondea hacia abajo
        const timelineWidth = this.timelineTrack.nativeElement.offsetWidth;
        const minutesInTimeline = (this.endHour - this.startHour) * 60;
        const tenMinutesWidth = Math.floor((10 / minutesInTimeline) * timelineWidth);

        // Posicionar el selection-box en el primer rango válido y con un ancho de 10 minutos
        this.renderer.setStyle(
            this.selectionBox.nativeElement,
            'left',
            `${startPixels}px`
        );
        this.renderer.setStyle(
            this.selectionBox.nativeElement,
            'width',
            `${tenMinutesWidth}px`
        );

        // Asegurar que isRangeAvailable sea verdadero
        this.isRangeAvailable = true;

        // Actualizar el valor de duration-label al cargar el componente
        this.updateDurationLabel();

        this.durationLabel.nativeElement.style.left = `${
            startPixels + tenMinutesWidth / 2 - 20
        }px`;
    }
}

  //v2
//   private setInitialSelectionBoxPosition() {
//     if (this.timeRanges.length > 0) {
//         const firstRange = this.timeRanges[0];

//         const startPixels = this.convertTimeToPixels(firstRange.startTime);

//         // Calcula el ancho en píxeles para 10 minutos
//         const timelineWidth = this.timelineTrack.nativeElement.offsetWidth;
//         const minutesInTimeline = (this.endHour - this.startHour) * 60;
//         const tenMinutesWidth = (10 / minutesInTimeline) * timelineWidth;


//         // Posicionar el selection-box en el primer rango válido y con un ancho de 10 minutos
//         this.renderer.setStyle(
//             this.selectionBox.nativeElement,
//             'left',
//             `${startPixels}px`
//         );
//         this.renderer.setStyle(
//             this.selectionBox.nativeElement,
//             'width',
//             `${tenMinutesWidth}px`
//         );

//         // Asegurar que isRangeAvailable sea verdadero
//         this.isRangeAvailable = true;

//         // Actualizar el valor de duration-label al cargar el componente
//         this.updateDurationLabel();

//         this.durationLabel.nativeElement.style.left = `${
//             startPixels + tenMinutesWidth / 2 - 20
//         }px`;
//     }
// }


  // V1
  /**
   * Sets the initial position and size of the selection box based on the first time range.
   *
   * This method performs the following actions:
   * - Calculates the pixel positions for the start and end times of the first time range.
   * - Positions the selection box at the calculated start position and sets its width.
   * - Ensures that the `isRangeAvailable` flag is set to true.
   * - Updates the duration label to reflect the current selection.
   * - Positions the duration label at the center of the selection box.
   *
   * Preconditions:
   * - `this.timeRanges` must contain at least one time range.
   * - `this.convertTimeToPixels` must be a valid method that converts a time value to pixel position.
   * - `this.renderer` must be a valid Angular Renderer2 instance.
   * - `this.selectionBox` and `this.durationLabel` must be valid ElementRef instances.
   */
  // private setInitialSelectionBoxPosition() {
  //   if (this.timeRanges.length > 0) {
  //     const firstRange = this.timeRanges[0];

  //     const startPixels = this.convertTimeToPixels(firstRange.startTime);
  //     const endPixels = this.convertTimeToPixels(firstRange.endTime);
  //     const width = endPixels - startPixels; // Restar 6 para mejorar la precisión

  //     // Posicionar el selection-box en el primer rango válido
  //     this.renderer.setStyle(
  //       this.selectionBox.nativeElement,
  //       'left',
  //       `${startPixels}px`
  //     );
  //     this.renderer.setStyle(
  //       this.selectionBox.nativeElement,
  //       'width',
  //       `${width}px`
  //     );

  //     // Asegurar que isRangeAvailable sea verdadero
  //     this.isRangeAvailable = true;

  //     // Actualizar el valor de duration-label al cargar el componente
  //     this.updateDurationLabel();

  //     this.durationLabel.nativeElement.style.left = `${
  //       startPixels + width / 2 - 20
  //     }px`;
  //   }
  // }

  private calculateSelectionDuration(): number {
    const width = this.selectionBox.nativeElement.offsetWidth;
    return this.convertPixelsToMinutes(width);
  }

  private convertPixelsToMinutes(pixels: number): number {
    const timelineWidth = this.timelineTrack.nativeElement.offsetWidth;
    const minutesInTimeline = (this.endHour - this.startHour) * 60;
    return (pixels / timelineWidth) * minutesInTimeline;
  }

  //v1
  private updateDurationLabel() {
    const duration = Math.round(this.calculateSelectionDuration());
    this.durationLabel.nativeElement.innerText = `${duration} min`;
  }
}
