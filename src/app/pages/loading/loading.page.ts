import { Component, DestroyRef, OnInit } from '@angular/core';
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

  dots: string = ".";
  timer?: number;

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
        this.dots = "."
      }
      else{
        this.dots += "."
      }
    }, 300);
  }
}
