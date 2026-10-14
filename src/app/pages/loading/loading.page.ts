import { Component, DestroyRef, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IonicModule } from '@ionic/angular';
import { AppInitService } from 'src/app/services/app-init.service';

@Component({
  standalone: true,
  imports: [IonicModule],
  selector: 'app-loading',
  templateUrl: './loading.page.html',
  styleUrls: ['./loading.page.scss'],
})
export class LoadingPage implements OnInit {

  protected dots = signal<string>(".");
  private timer?: number;

  constructor(private appInitService: AppInitService, private destroyRef: DestroyRef) { }

  ngOnInit() {
    this.appInitService.isAppInit
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isAppInit) => {
        if(isAppInit){
          clearInterval(this.timer)
        }
      });

    this.appInitService.init();
    
    this.fillDots();
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }

  fillDots(){
    this.timer = setInterval(() => {
      if(this.dots.length == 4 ){
        this.setDots(".");
      }
      else{
        this.setDots(this.dots() + ".");
      }
    }, 300);
  }

  private setDots(value: string){
    this.dots.set(value)
  }
}
