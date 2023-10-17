import { Component, Inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { NoSapceService } from '../../components/validations/no-sapce.service';
import { SettingsService } from '../../services/settings.service';
import * as dayjs from 'dayjs';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
})
export class FormIndexComponent implements OnInit {
  form: FormGroup = new FormGroup({});
  selectedInterval = '';
  autoHarvest = false;
  hours = [];
  minutes = [];
  weekDays = [
    {key: 0, value: 'Sunday'},
    {key: 1, value: 'Monday'},
    {key: 2, value: 'Tuesday'},
    {key: 3, value: 'Wednesday'},
    {key: 4, value: 'Thursday'},
    {key: 5, value: 'Friday'},
    {key: 6, value: 'Saturday'},
  ];
  monthDays = [];
  months = [
    {key: 0, value: 'January'},
    {key: 1, value: 'February'},
    {key: 2, value: 'March'},
    {key: 3, value: 'April'},
    {key: 4, value: 'May'},
    {key: 5, value: 'June'},
    {key: 6, value: 'July'},
    {key: 7, value: 'August'},
    {key: 8, value: 'September'},
    {key: 9, value: 'October'},
    {key: 10, value: 'November'},
    {key: 11, value: 'December'},
  ];
  async submit() {
    if (!this.form.valid) {
      this.toastr.error('You have some errors. Please check the form.');
      return;
    }
    await this.spinner.show();
    if (this.data.event == 'New') {
      const response = await this.settingsService.saveIndexesSettings(this.form.value, true, null);
      await this.spinner.hide();
      if (response.success === true) {
        this.dialogRef.close(true);
        this.toastr.success('Index saved successfully');
      } else {
        this.toastr.error(response?.message ? response.message : 'Oops! something went wrong', 'Save index failed');
      }
    } else if (this.data.event == 'Edit') {
      const indexes = await this.settingsService.readIndexesSettings();
      const newIndexesArray = indexes.map((obj) => {
        if (obj.id === this.data.body[0].id) {
          return {
            ...obj,
            name: this.form.value.name,
            description: this.form.value.description,
            to_be_indexed: this.form.value.to_be_indexed,
            auto_harvest: this.form.value.auto_harvest,
            interval: this.form.value.interval,
            interval_month: this.form.value.interval_month,
            interval_month_day: this.form.value.interval_month_day,
            interval_week_day: this.form.value.interval_week_day,
            interval_hour: this.form.value.interval_hour,
            interval_minute: this.form.value.interval_minute,
            created_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          };
        }
        return obj;
      });
      const response = await this.settingsService.saveIndexesSettings(
        newIndexesArray,
        false,
        null,
      );
      await this.spinner.hide();
      if (response.success === true) {
        this.dialogRef.close(true);
        this.toastr.success('Index saved successfully');
      } else {
        this.toastr.error(response?.message ? response.message : 'Oops! something went wrong', 'Save index failed');
      }
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
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
  ) {}

  populateForm(data = {
    name: '',
    description: '',
    to_be_indexed: false,
    auto_harvest: false,
    interval: '',
    interval_month: '',
    interval_month_day: '',
    interval_week_day: '',
    interval_hour: '',
    interval_minute: '',
    isEdit: false
  }) {
    const controls = {
      name: [
        {
          value: '',
          disabled: data.isEdit
        },
        [
          Validators.required,
          NoSapceService.cannotContainSpace,
          NoSapceService.lowercaseValidator,
        ],
      ],
      to_be_indexed: [false],
      description: [''],
      auto_harvest: [false],
      interval: [''],
      interval_month: [''],
      interval_month_day: [''],
      interval_week_day: [''],
      interval_hour: [''],
      interval_minute: [''],
    };
    this.form = this.fb.group(controls);

    this.form.get('auto_harvest')?.valueChanges.subscribe(value => {
      this.autoHarvest = value;
      if (this.autoHarvest) {
        this.form.get('interval')?.setValidators(Validators.required);
        this.form.get('interval')?.enable();
      } else {
        this.form.get('interval')?.clearValidators();
        this.form.get('interval')?.disable();
        this.form.get('interval')?.setValue('');
      }
    });

    this.form.get('interval')?.valueChanges.subscribe(value => {
      const relatedFields = {
        interval_hour: ['daily', 'weekly', 'monthly', 'yearly'],
        interval_minute: ['daily', 'weekly', 'monthly', 'yearly'],
        interval_week_day: ['weekly'],
        interval_month_day: ['yearly', 'monthly'],
        interval_month: ['yearly'],
      };
      this.selectedInterval = value;
      if (this.selectedInterval != null && this.selectedInterval !== '') {
        for (const field in relatedFields) {
          if (relatedFields[field].indexOf(this.selectedInterval) !== -1) {
            this.form.get(field)?.setValidators(Validators.required);
            this.form.get(field)?.enable();
          } else {
            this.form.get(field)?.clearValidators();
            this.form.get(field)?.disable();
          }
        }
      } else {
        for (const field in relatedFields) {
          this.form.get(field)?.clearValidators();
          this.form.get(field)?.disable();
        }
      }
    });

    for (const field in controls) {
      this.form.get(field)?.setValue(data?.[field]);
    }
  }

  async ngOnInit() {
    for (let hour = 0; hour < 24; hour++) {
      let hourString = hour.toString();
      hourString = hourString.length === 1 ? '0' + hourString : hourString;
      this.hours.push(hourString);
    }
    for (let minute = 0; minute < 60; minute++) {
      let minuteString = minute.toString();
      minuteString = minuteString.length === 1 ? '0' + minuteString : minuteString;
      this.minutes.push(minuteString);
    }
    for (let monthDay = 1; monthDay <= 31; monthDay++) {
      let monthDayString = monthDay.toString();
      monthDayString = monthDayString.length === 1 ? '0' + monthDayString : monthDayString;
      this.monthDays.push(monthDayString);
    }

    this.populateForm();
    if (this.data.event == 'Edit') {
      const data = {
        name: this.data.body[0].name,
        description: this.data.body[0].description,
        to_be_indexed: this.data.body[0].to_be_indexed,
        auto_harvest: this.data.body[0].auto_harvest,
        interval: this.data.body[0].interval,
        interval_month: this.data.body[0].interval_month,
        interval_month_day: this.data.body[0].interval_month_day,
        interval_week_day: this.data.body[0].interval_week_day,
        interval_hour: this.data.body[0].interval_hour,
        interval_minute: this.data.body[0].interval_minute,
        isEdit: true,
      };
      this.populateForm(data);
    } else {
      const data = {
        name: '',
        description: '',
        to_be_indexed: false,
        auto_harvest: false,
        interval: '',
        interval_month: '',
        interval_month_day: '',
        interval_week_day: '',
        interval_hour: '',
        interval_minute: '',
        isEdit: false
      };
      this.populateForm(data);
    }
  }
}
