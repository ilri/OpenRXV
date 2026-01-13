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
