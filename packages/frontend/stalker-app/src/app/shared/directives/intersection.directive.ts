import { AfterViewInit, Directive, ElementRef, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { debounceTime, Observable, Subscription } from 'rxjs';

@Directive({
  standalone: true,
  selector: '[intersection]',
  exportAs: 'intersection',
})
export class IntersectionDirective implements AfterViewInit, OnDestroy {
  @Input() root: HTMLElement | null = null;
  @Input() rootMargin = '0px 0px 0px 0px';
  @Input() threshold = 0;
  @Input() debounceTime = 500;
  @Input() isContinuous = false;

  @Output() isIntersecting = new EventEmitter<boolean>();

  _isIntersecting = false;
  subscription: Subscription | null = null;

  constructor(private element: ElementRef) {}

  ngAfterViewInit() {
    this.subscription = this.createAndObserve();
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
    this.subscription = null;
  }

  createAndObserve() {
    const options: IntersectionObserverInit = {
      root: this.root,
      rootMargin: this.rootMargin,
      threshold: this.threshold,
    };

    return new Observable<boolean>((subscriber) => {
      const intersectionObserver = new IntersectionObserver((entries) => {
        const { isIntersecting } = entries[0];
        subscriber.next(isIntersecting);

        isIntersecting && !this.isContinuous && intersectionObserver.disconnect();
      }, options);

      intersectionObserver.observe(this.element.nativeElement);

      return {
        unsubscribe() {
          intersectionObserver.disconnect();
        },
      };
    })
      .pipe(debounceTime(this.debounceTime))
      .subscribe((status) => {
        this.isIntersecting.emit(status);
        this._isIntersecting = status;
      });
  }
}
