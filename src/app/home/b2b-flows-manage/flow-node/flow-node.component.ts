import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { B2bFlowService } from '../b2b-flow.service';

@Component({
  selector: '[odp-flow-node]',
  templateUrl: './flow-node.component.html',
  styleUrls: ['./flow-node.component.scss']
})
export class FlowNodeComponent implements OnInit {

  @Input() index: number;
  @Input() prevNode: any;
  @Input() currNode: any;
  @Input() nodeList: any;
  @Output() nodeListChange: EventEmitter<any>;
  @Input() branchIndex: number;

  nextNode: any;
  successPaths: Array<any>;
  errorPaths: Array<any>;
  isMouseDown: any;
  selectedPathIndex: number;
  selectedPath: any;
  selectedPathType: any;
  selectedNode: any;
  showDeleteNodeIcon: boolean;
  constructor(private flowService: B2bFlowService) {
    this.index = -1;
    this.nodeListChange = new EventEmitter();
    this.branchIndex = -1;
    this.successPaths = [];
    this.errorPaths = [];
    this.nodeList = [];
  }

  ngOnInit(): void {
    this.renderPaths();
    this.flowService.selectedNode.subscribe((data) => {
      this.selectedPathIndex = null;
      if (data && data.currNode._id == this.currNode._id) {
        this.selectedNode = data.currNode;
      } else {
        this.selectedNode = null;
      }
    });
    this.flowService.reCreatePaths.subscribe(() => {
      this.successPaths = [];
      this.errorPaths = [];
      this.renderPaths();
    });
    this.prevNode = this.nodeList.find((e: any) => (e.onSuccess || []).find(ei => ei._id == this.currNode._id));
  }

  renderPaths() {
    if (this.currNode.onSuccess && this.currNode.onSuccess.length > 0) {
      this.currNode.onSuccess.forEach((item: any) => {
        const nextNode = this.nodeList.find((e: any) => e._id == item._id);
        if (nextNode) {
          const path = this.flowService.generateLinkPath(this.currNode.coordinates.x + 146, this.currNode.coordinates.y + 18, nextNode.coordinates.x - 6, nextNode.coordinates.y + 18, 1.5);
          this.successPaths.push({
            _id: nextNode._id,
            name: item.name,
            color: item.color,
            prevNode: this.currNode._id,
            path
          });
        }
      });
    }
    if (this.currNode.onError && this.currNode.onError.length > 0) {
      this.currNode.onError.forEach((item: any) => {
        const nextNode = this.nodeList.find((e: any) => e._id == item._id);
        if (nextNode) {
          const path = this.flowService.generateLinkPath(this.currNode.coordinates.x + 146, this.currNode.coordinates.y + 18, nextNode.coordinates.x - 6, nextNode.coordinates.y + 18, 1.5);
          this.errorPaths.push({
            _id: nextNode._id,
            name: item.name,
            color: item.color,
            prevNode: this.currNode._id,
            path
          });
        }
      });
    }
  }

  createPaths(source: any, target: any) {
    const sourceId = source.dataset.id;
    const targetId = target.dataset.id;
    const sourceNode = this.nodeList.find((e: any) => e._id == sourceId);
    const targetNode = this.nodeList.find((e: any) => e._id == targetId);
    if (sourceNode && targetNode) {
      if (!sourceNode.onSuccess) {
        sourceNode.onSuccess = [];
      }
      sourceNode.onSuccess.push({
        _id: targetNode._id
      });
    }
  }

  selectPath(event: any, index: number, path: any, type: string) {
    setTimeout(() => {
      this.selectedPathIndex = index;
      this.selectedPath = path;
      this.selectedPathType = type;
    }, 200);
    this.flowService.selectedNode.emit(null);
    this.flowService.selectedPath.emit({ index, path });
  }

  isActive(place: string) {
    if (this.flowService.anchorSelected && this.flowService.anchorSelected.dataset.id == this.currNode._id) {
      if (place == 'start' && this.flowService.anchorSelected.classList.contains('start')) {
        return true;
      } else if (place == 'end' && this.flowService.anchorSelected.classList.contains('end')) {
        return true;
      }
    }
    return false;
  }

  openProperties(event: any) {
    this.flowService.selectedNode.emit({
      currNode: this.currNode,
      prevNode: this.prevNode
    });
  }

  // @HostListener('document:keydown', ['$event'])
  // onDeleteKey(event: any) {
  //   if (((event.metaKey || event.ctrlKey) && event.key == 'Backspace') || event.key == 'Delete') {
  //     this.deletePath();
  //   }
  // }

  deletePath() {
    let onSuccess = true;
    let nodeIndex = (this.currNode.onSuccess || []).findIndex(e => e._id == this.selectedPath?._id);
    if (nodeIndex == -1) {
      onSuccess = false;
      nodeIndex = (this.currNode.onError || []).findIndex(e => e._id == this.selectedPath?._id);
    }
    if (nodeIndex > -1) {
      if (onSuccess) {
        (this.currNode.onSuccess || []).splice(nodeIndex, 1);
      } else {
        (this.currNode.onError || []).splice(nodeIndex, 1);
      }
    }
    this.flowService.reCreatePaths.emit(null);
  }

  onAnchorClick(event: any) {
    // event.stopPropagation();
    // event.preventDefault();
    this.isMouseDown = null;
    if (!this.flowService.anchorSelected) {
      this.flowService.anchorSelected = event.target;
    } else {
      let sourceEle, targetEle;
      if ((event.target as HTMLElement).classList.contains('start')) {
        sourceEle = this.flowService.anchorSelected;
        targetEle = event.target;
      } else {
        sourceEle = event.target;
        targetEle = this.flowService.anchorSelected;
      }
      this.flowService.anchorSelected = null;
      if (sourceEle.dataset.id !== targetEle.dataset.id) {
        this.createPaths(sourceEle, targetEle);
        this.flowService.reCreatePaths.emit();
      }
    }
  }

  getPathTextStyle(path: any) {
    const nextNode = this.nodeList.find((e: any) => e._id == path._id);
    if (!nextNode) {
      return '';
    }
    let sourceNodeX = (this.currNode.coordinates.x + 140);
    let sourceNodeY = (this.currNode.coordinates.y + 36);
    let x = (nextNode.coordinates.x - sourceNodeX) / 2 + sourceNodeX;
    let y = (nextNode.coordinates.y - sourceNodeY) / 2 + sourceNodeY;
    return {
      transform: `translate(${x}px,${y}px)`,
    }
  }

  get isSelected() {
    if (this.currNode._id && this.selectedNode && this.selectedNode._id) {
      return true;
    }
    return false;
  }

  get isSelectedPath() {
    if (this.currNode._id && this.selectedPath && this.selectedPath.prevNode == this.currNode._id) {
      return true;
    }
    return false;
  }

  get isInputNode() {
    return this.nodeList[0]._id == this.currNode._id;
  }

  get nodeType() {
    return this.flowService.getNodeType(this.currNode, this.isInputNode);
  }
}
