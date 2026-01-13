import { Directive, ElementRef, EventEmitter, Output, OnDestroy, OnInit, Input, inject } from '@angular/core';

@Directive({
    selector: '[appIntersectionObserver]',
    standalone: true
})
export class IntersectionObserverDirective implements OnInit, OnDestroy {
  private element = inject(ElementRef);

  @Output() visibilityChange = new EventEmitter<boolean>();
  @Input() options: IntersectionObserverInit = {
      threshold: [0, 0.2, 0.4, 0.6, 0.8, 1]
  };
  private observer: IntersectionObserver;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  firstIntersectionEmitted = false;
  ngOnInit() {
    this.observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        let timeout = 0;
        // Delay the first intersection a bit until the layout is well loaded
        console.log('this.firstIntersectionEmitted => ', this.firstIntersectionEmitted)
        if (entry.isIntersecting && !this.firstIntersectionEmitted) {
          this.firstIntersectionEmitted = true;
          timeout = 200;
        }
        setTimeout(() => {
          this.visibilityChange.emit(entry.isIntersecting);
        }, timeout);
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
