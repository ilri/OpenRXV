import { Component, OnInit, OnChanges, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder } from '@angular/forms';
import { SettingsService } from '../../services/settings.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-plugin',
  templateUrl: './plugin.component.html',
  styleUrls: ['./plugin.component.scss'],
})
export class PluginComponent implements OnInit, OnChanges {
  @Input() plugins: any = null;
  @Input() pluginIndex = 0;
  plugin: any = null;
  formdata: UntypedFormArray = new UntypedFormArray([]);
  active = false;
  index_name: string;
  repositoriesList: [] = [];
  @Output() onEdit: EventEmitter<any> = new EventEmitter();

  constructor(
    private fb: UntypedFormBuilder,
    private settingService: SettingsService,
    private activeRoute: ActivatedRoute,
    ) {}
  activeChange() {
    if (!this.active) this.formdata = new UntypedFormArray([]);
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
  async ngOnInit() {
    this.plugin = this.plugins[this.pluginIndex];
    this.index_name = this.activeRoute.snapshot.paramMap.get('index_name');
    const repositories = await this.settingService.read(this.index_name);
    this.repositoriesList = repositories?.repositories.map(repository => repository.name);

    if (this.plugin.values.length) {
      this.active = true;
      this.plugin.values.forEach((element) => {
        this.addNew(element);
      });
    }

    this.formdata.valueChanges.subscribe((d) => this.sendValue());
    this.sendValue();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.plugin = changes.plugins.currentValue[this.pluginIndex];
    if (this.plugin.importedValues) {
      this.active = true;
      this.plugin.importedValues.map((element) => {
        this.addNew(element);
      });
      this.formdata.valueChanges.subscribe((d) => this.sendValue());
      this.sendValue();
    }
  }

  addNew(value = null) {
    const form = {};
    this.plugin.params.forEach((element, index) => {
      if (element?.items && !Array.isArray(element.items)) {
        if (element.items === 'repositoriesList') {
          this.plugin.params[index].items = this.repositoriesList;
        } else {
          this.plugin.params[index].items = [];
        }
      }
      if (value) form[element.name] = this.fb.control(value[element.name]);
      else form[element.name] = this.fb.control('');
    });
    this.formdata.push(this.fb.group(form));
  }

  delete(index) {
    this.formdata.removeAt(index);
  }
}
