import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AppService } from 'src/app/utils/services/app.service';
import { CommonService } from 'src/app/utils/services/common.service';
import { environment } from 'src/environments/environment';
import { B2bFlowService } from '../b2b-flow.service';

@Component({
  selector: 'odp-path-properties',
  templateUrl: './path-properties.component.html',
  styleUrls: ['./path-properties.component.scss']
})
export class PathPropertiesComponent implements OnInit {

  @Input() edit: any;
  @Input() path: any;
  @Input() flowData: any;
  @Input() nodeList: Array<any>;
  @Output() close: EventEmitter<any>;
  @Output() changesDone: EventEmitter<any>;
  nodeIndex: number
  constructor(private commonService: CommonService,
    private appService: AppService,
    private flowService: B2bFlowService) {
    this.edit = { status: true };
    this.close = new EventEmitter();
    this.changesDone = new EventEmitter();
    this.nodeList = [];
  }

  ngOnInit(): void {
    // this.nodeIndex = this.nodeList.findIndex(e => (e.onSuccess || []).find((es, ei) => es._id == this.path.path._id && ei == this.path.index));
    this.nodeIndex = this.nodeList.findIndex(e => e._id == this.path.path.prevNode);
    if (!environment.production) {
      console.log(this.path);
      console.log(this.nodeIndex);
    }
  }

  deletePath() {
    (this.nodeList[this.nodeIndex].onSuccess || []).splice(this.path.index, 1);
    this.cancel();
    this.flowService.selectedPath.emit(null);
    this.flowService.reCreatePaths.emit(null);
  }

  cancel() {
    this.close.emit(false);
  }

  get condition() {
    if (this.nodeList[this.nodeIndex] && this.nodeList[this.nodeIndex].onSuccess && this.nodeList[this.nodeIndex].onSuccess[this.path.index]) {
      return this.nodeList[this.nodeIndex].onSuccess[this.path.index].condition;
    }
  }

  set condition(condition: string) {
    if (this.nodeList[this.nodeIndex] && this.nodeList[this.nodeIndex].onSuccess && this.nodeList[this.nodeIndex].onSuccess[this.path.index]) {
      this.nodeList[this.nodeIndex].onSuccess[this.path.index].condition = condition;
    }
  }
}