import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { TimeLineComponent } from './common/slider/time-line/time-line.component';
import { NgxTimeSliderComponent } from './common/slider/ngx-time-slider/ngx-time-slider.component';
import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';
import { LineSliderComponent } from './common/slider/line-slider/line-slider.component';

@NgModule({
  declarations: [
    AppComponent,
    TimeLineComponent,
    NgxTimeSliderComponent,
    LineSliderComponent
  ],
  imports: [
    BrowserModule,
    NgxSliderModule,
    MatSliderModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
