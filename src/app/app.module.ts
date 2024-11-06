import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { TimeLineComponent } from './common/slider/time-line/time-line.component';
import { NgxTimeSliderComponent } from './common/slider/ngx-time-slider/ngx-time-slider.component';
import { NgxSliderModule } from '@angular-slider/ngx-slider';

@NgModule({
  declarations: [
    AppComponent,
    TimeLineComponent,
    NgxTimeSliderComponent
  ],
  imports: [
    BrowserModule,
    NgxSliderModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
