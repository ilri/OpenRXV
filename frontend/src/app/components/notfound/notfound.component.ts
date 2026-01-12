import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
    selector: 'app-notfound',
    templateUrl: './notfound.component.html',
    styleUrls: ['./notfound.component.scss'],
    standalone: true,
    imports: [RouterLink, RouterLinkActive],
})
export class NotfoundComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
