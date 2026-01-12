import { Directive, ElementRef, EventEmitter, Output, OnDestroy, OnInit, Input } from '@angular/core';

@Directive({
  selector: '[appIntersectionObserver]'
})
export class IntersectionObserverDirective implements OnInit, OnDestroy {
  @Output() visibilityChange = new EventEmitter<boolean>();
  @Input() options: IntersectionObserverInit = {
      threshold: [0, 0.2, 0.4, 0.6, 0.8, 1]
  };
  private observer: IntersectionObserver;

  constructor(private element: ElementRef) {}

  ngOnInit() {
    this.observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        this.visibilityChange.emit(entry.isIntersecting);
      });
    }, this.options);

    this.observer.observe(this.element.nativeElement);
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
