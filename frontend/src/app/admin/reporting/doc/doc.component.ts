import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { MatDialogTitle, MatDialogContent } from '@angular/material/dialog';
@Component({
  selector: 'app-doc',
  templateUrl: './doc.component.html',
  styleUrls: ['./doc.component.scss'],
  imports: [MatDialogTitle, MatDialogContent],
})
export class DocComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}

  image(image) {
    return environment.api + '/images/' + image;
  }
}
