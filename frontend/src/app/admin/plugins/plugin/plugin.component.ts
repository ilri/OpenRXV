import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormArray, FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-plugin',
  templateUrl: './plugin.component.html',
  styleUrls: ['./plugin.component.scss'],
})
export class PluginComponent implements OnInit {
  @Input() plugin: any = null;
  formdata: FormArray = new FormArray([]);
  active = false;
  @Output() onEdit: EventEmitter<any> = new EventEmitter();

  constructor(private fb: FormBuilder) {}
  activeChange() {
    if (!this.active) this.formdata = new FormArray([]);
    else if (
      this.active &&
      this.plugin.multiple == 'false' &&
      this.plugin.values.length == 0
    )
      this.addNew();

    this.sendValue();
  }

  sendValue() {
    this.onEdit.emit({
      name: this.plugin.name,
      active: this.active,
      form: this.formdata,
    });
  }
  ngOnInit(): void {
    if (this.plugin.values.length) {
      this.active = true;
      this.plugin.values.forEach((element) => {
        this.addNew(element);
      });
    }

    this.formdata.valueChanges.subscribe((d) => this.sendValue());
    this.sendValue();
  }

  addNew(value = null) {
    const form = {};
    this.plugin.params.forEach((element) => {
      if (value) form[element.name] = this.fb.control(value[element.name]);
      else form[element.name] = this.fb.control('');
    });
    this.formdata.push(this.fb.group(form));
  }

  delete(index) {
    this.formdata.removeAt(index);
  }
}
