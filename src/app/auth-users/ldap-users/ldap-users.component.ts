import { Component, OnInit, Input, Output, EventEmitter, TemplateRef, ViewChild, OnDestroy } from '@angular/core';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';

import { UserDetails } from 'src/app/utils/interfaces/userDetails';
import { CommonService } from 'src/app/utils/services/common.service';
import { AppService } from 'src/app/utils/services/app.service';

@Component({
  selector: 'odp-ldap-users',
  templateUrl: './ldap-users.component.html',
  styleUrls: ['./ldap-users.component.scss']
})
export class LdapUsersComponent implements OnInit, OnDestroy {

  @Input() admin: boolean;
  @Input() toggle: boolean;
  @Output() toggleChange: EventEmitter<boolean>;

  @ViewChild('importingUsersModal', { static: false }) importingUsersModal: TemplateRef<HTMLElement>;
  @ViewChild('importDetailsModal', { static: false }) importDetailsModal: TemplateRef<HTMLElement>;
  importDetailsModalRef: NgbModalRef;
  subscriptions: any;
  users: Array<UsersResponse>;
  importingUsersModalRef: NgbModalRef;
  selectedUsers: Array<UserDetails>;
  searchModal: {
    bindPassword?: string;
    searchText?: string;
  };
  constructor(
    private commonService: CommonService,
    private appService: AppService,
    private ts: ToastrService) {
    const self = this;
    self.subscriptions = {};
    self.users = [];
    self.selectedUsers = [];
    self.searchModal = {};
    self.toggleChange = new EventEmitter();
  }

  ngOnInit() {
    const self = this;
    if (!self.appService.ldapUserPass) {
      self.toggleChange.emit(false);
    }
    self.searchModal.bindPassword = self.appService.ldapUserPass;
  }

  ngOnDestroy() {
    const self = this;
    Object.keys(self.subscriptions).forEach(e => {
      self.subscriptions[e].unsubscribe();
    });
    if (self.importingUsersModalRef) {
      self.importingUsersModalRef.close();
    }
    if (self.importDetailsModalRef) {
      self.importDetailsModalRef.close();
    }
  }

  searchUsers() {
    const self = this;
    if (!self.searchModal.searchText || !self.searchModal.searchText.trim()) {
      self.searchModal.searchText = null;
      return;
    }
    self.commonService.post('user', '/auth/ldap/search', self.searchModal).subscribe(res => {
      self.users = res;
      self.users.forEach(u => {
        if (self.selectedUsers.find(e => e.username && u.username
          && e.username.toLowerCase() === u.username.toLowerCase())) {
          u.selected = true;
        }
        self.checkIfUserExist(u);
      });
    }, err => {
      self.users = [];
      console.log(err);
    });
  }

  resetSearch() {
    const self = this;
    self.searchModal.searchText = null;
    self.users = [];
  }

  toggleSelectedUser(index: number) {
    const self = this;
    if (self.users[index].exist) {
      return;
    }
    const temp: UserDetails = {};
    self.users[index].selected = !self.users[index].selected;
    temp.username = self.users[index].username;
    temp.basicDetails = {};
    temp.basicDetails.alternateEmail = self.users[index].email;
    temp.basicDetails.name = self.users[index].name;
    temp.auth = {};
    temp.auth.authType = 'ldap';
    temp.auth.dn = self.users[index].dn;
    temp.accessControl = {};
    temp.accessControl.accessLevel = 'None';
    temp.accessControl.apps = [];
    temp.isSuperAdmin = false;

    const tempIndex = self.selectedUsers.findIndex(u => u.username === temp.username);
    if (tempIndex > -1) {
      self.selectedUsers.splice(tempIndex, 1);
    } else {
      self.selectedUsers.push(temp);
    }
  }

  importUsers() {
    const self = this;
    self.importingUsersModalRef = self.commonService
      .modal(self.importingUsersModal, { centered: true, beforeDismiss: () => false });
    self.importingUsersModalRef.result.then(close => { }, dismiss => { });
    self.commonService.post('user', '/auth/ldap/import', self.selectedUsers).subscribe(res => {
      self.importingUsersModalRef.close();
      self.appService.toggleSideNav.emit(true);
      self.toggleChange.emit(false);
      // self.router.navigate(['/app', self.commonService.app._id, 'cp', 'user']);
      self.ts.success(self.selectedUsers.length + ' user(s) were imported.');
    }, err => {
      self.importingUsersModalRef.close();
      self.commonService.errorToast(err);
    });
  }

  checkIfUserExist(user: UsersResponse) {
    const self = this;
    self.commonService.get('user', `/${this.commonService.app._id}/user`, { filter: { username: user.username }, select: '_id', noApp: true }).subscribe(res => {
      if (res && res.length > 0) {
        user.selected = true;
        user.exist = true;
      }
    }, err => { });
  }

  importUserDetails() {
    const self = this;
    self.importDetailsModalRef = self.commonService.modal(self.importDetailsModal, { centered: true, size: 'lg' });
    self.importDetailsModalRef.result.then(close => {
      if (close) {
        self.importUsers();
      }
    }, dismiss => { });
  }

  cancel() {
    const self = this;
    self.toggleChange.emit(false);
  }

  get allUserSelected() {
    const self = this;
    return Math.min.apply(null, self.users.map(e => e.selected));
  }
  set allUserSelected(val: any) {
    const self = this;
    self.users.forEach(e => {
      if (!e.exist) {
        e.selected = val;
        const tempIndex = self.selectedUsers.findIndex(u => u.username === e.username);
        if (val) {
          if (tempIndex === -1) {
            self.selectedUsers.push({
              username: e.username,
              basicDetails: {
                alternateEmail: e.email,
                name: e.name
              },
              auth: {
                dn: e.dn,
              },
              accessControl: {
                accessLevel: 'None',
                apps: []
              },
              isSuperAdmin: false
            });
          }
        } else {
          self.selectedUsers.splice(tempIndex, 1);
        }
      }
    });
  }

}

export interface UsersResponse {
  username?: string;
  name?: string;
  email?: string;
  dn?: string;
  selected?: boolean;
  exist?: boolean;
}
