/*
  Sliver Implant Framework
  Copyright (C) 2020  Bishop Fox
  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.
  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.
  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormBuilder, ValidatorFn, ValidationErrors, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription } from 'rxjs';

import { ClientService } from '@app/providers/client.service';
import { SliverService } from '@app/providers/sliver.service';
import { FadeInOut } from '@app/shared/animations';

import * as clientpb from 'sliver-script/lib/pb/clientpb/client_pb';
import { EventsService } from '@app/providers/events.service';


@Component({
  selector: 'generate-generate',
  templateUrl: './generate.component.html',
  styleUrls: ['./generate.component.scss'],
  animations: [FadeInOut]
})
export class GenerateComponent implements OnInit {

  implantConfig: clientpb.ImplantConfig;
  generateForm: FormGroup;
  generateNameFormSub: Subscription;
  namePattern = RegExp('^[a-zA-Z0-9]*$');

  constructor(public dialog: MatDialog,
              private _router: Router,
              private _sliverService: SliverService,
              private _clientService: ClientService,
              private _eventsService: EventsService,
              private _fb: FormBuilder) { }

  ngOnInit(): void {
    this.generateForm = this._fb.group({
      generateCodename: [true],
      saveAsProfile: [false],
      codename: [{value: '', disabled: this.generateCodename}],
      profileName: [{value: '', disabled: this.saveAsProfile}],
    }, {
      validators: [
        this.validatedGenerateForm()
      ]
    });
  }

  get generateCodename(): boolean {
    return this.generateForm?.controls['generateCodename']?.value ? true : false;
  }

  get saveAsProfile(): boolean {
    return this.generateForm?.controls['saveAsProfile']?.value ? true : false;
  }

  async onImplantConfig(implantConfig: clientpb.ImplantConfig) {
    this.implantConfig = implantConfig;
  }

  async generate() {
    setTimeout(async () => {
      const file = await this._sliverService.generate(this.implantConfig);
      this._eventsService.notify(`Build ${file.getName()} completed`, 'Download', 10, () => {
        this._clientService.saveFile('Save', 'Save Implant', file.getName(), file.getData_asU8());
      });
    }, 0);
    this.generatingDialog();
  }

  getCodename() {
    return String(this.generateForm.controls['codename'].value).trim();
  }

  validatedGenerateForm(): ValidatorFn {
    return (group: AbstractControl): (ValidationErrors | null) => {
      if (this.generateForm === undefined || this.generateCodename) {
        return null;
      }
      const codename = group.get('codename').value;
      if (codename.length < 1) {
        return {badCodenameLength: {value: codename}};
      }
      if (!this.namePattern.test(codename)) {
        return {badCodenamePattern: {value: codename}};
      }
      return null;
    };
  }

  generatingDialog() {
    const dialogRef = this.dialog.open(GeneratingDialogComponent);
    dialogRef.afterClosed().subscribe(() => {
      this._router.navigate(['generate', 'builds']);
    });
  }

}

@Component({
  selector: 'generate-generating-dialog',
  templateUrl: './generating.dialog.html',
})
export class GeneratingDialogComponent {

  constructor(public dialogRef: MatDialogRef<GeneratingDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

}
