import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoSapceService } from '../../components/validations/no-sapce.service';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})

export class FormIndexComponent implements OnInit {
  form: FormGroup = new FormGroup({});
  async submit() {
    if (this.form.valid && this.data.event == "New") {
      this.dialogRef.close(await this.settingsService.saveIndexesSettings(this.form.value, true));
      console.log("this.form.value", this.form.value) 
    } else if (this.form.valid && this.data.event == "Edit") {
      let indexes = await this.settingsService.readIndexesSettings();
      const newIndexesArray = indexes.indexes.map(obj => {
        if (obj.id === this.data.body[0].id) {
          return {...obj, name: this.form.value.name, description: this.form.value.description, created_at: new Date().toLocaleString()};
        }
        return obj;
      });
      const ind = await this.settingsService.saveIndexesSettings({indexes: newIndexesArray}, false);
      this.dialogRef.close();
    }
  }
  onNoClick(e): void {
    e.preventDefault();
    this.dialogRef.close();
  }
  constructor(
    public dialogRef: MatDialogRef<FormIndexComponent>,
    private fb: FormBuilder,
    private settingsService: SettingsService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) { }
   nonWhitespaceRegExp: RegExp = new RegExp("\\S");
    populateForm(data = {name: '', description: '' }) {
      this.form = this.fb.group({
        name: [data.name, [ Validators.required, NoSapceService.cannotContainSpace, NoSapceService.lowercaseValidator]],
        description: [data.description]
      });
    
    }
  async ngOnInit() {
    this.populateForm();
    if(this.data.event == "Edit") {
      const data = {name: this.data.body[0].name, description: this.data.body[0].description};
      await this.populateForm(data);
    } else {
      const data = {name: '', description: ''};
      await this.populateForm(data);
    }
  }

}
