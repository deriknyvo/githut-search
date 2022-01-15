import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from '../dialog/dialog.component';
import { User, Repository } from '../interfaces';

@Component({
  selector: 'app-result-list',
  templateUrl: './result-list.component.html',
  styleUrls: ['./result-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResultListComponent {

  @Input() listResults!: Array<any>;

  constructor(private dialog: MatDialog) {}

  openDialog(item: any) {
    this.dialog.open(DialogComponent, {
      maxHeight: '600px',
      maxWidth: '1152px',
      data: item,
      panelClass: 'custom-dialog-container'
    });
  }
}
