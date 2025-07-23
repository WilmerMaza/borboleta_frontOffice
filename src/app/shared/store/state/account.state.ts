import { Injectable } from "@angular/core";
import { Action, Selector, State, StateContext, Store } from "@ngxs/store";
import { tap } from "rxjs";
import { AccountUser, AccountUserUpdatePassword } from "../../interface/account.interface";
import { AccountService } from "../../services/account.service";
import { NotificationService } from "../../services/notification.service";
import { AccountClear, CreateAddress, DeleteAddress, GetUserDetails, UpdateAddress, UpdateUserPassword, UpdateUserProfile } from "../action/account.action";

export class AccountStateModel {
  user: AccountUser | null;
  permissions: [];
}

@State<AccountStateModel>({
    name: "account",
    defaults: {
      user: null,
      permissions: []
    },
})

@Injectable()
export class AccountState{

  constructor(private store: Store,
    private accountService: AccountService,
    private notificationService: NotificationService) {}

  @Selector()
  static user(state: AccountStateModel) {
    return state.user;
  }

  @Selector()
  static permissions(state: AccountStateModel) {
    return state.permissions;
  }

  @Action(GetUserDetails)
  getUserDetails(ctx: StateContext<AccountStateModel>) {
    return this.accountService.getUserDetails().pipe(
      tap({
        next: result => {
          ctx.patchState({
            user: result,
            permissions: result.permission,
          });
        },
        error: err => {
          throw new Error(err?.error?.message);
        }
      })
    );
  }

  @Action(UpdateUserProfile)
  updateProfile(ctx: StateContext<AccountStateModel>, { payload }: UpdateUserProfile) {
    // Update Profile Logic Here
  }

  @Action(UpdateUserPassword)
  updatePassword(ctx: StateContext<AccountUserUpdatePassword>, { payload }: UpdateUserPassword) {
    // Update Password Logic Here
  }

  @Action(CreateAddress)
  createAddress(ctx: StateContext<AccountStateModel>, action: CreateAddress) {
    const state = ctx.getState();
    const user = state.user;
    if (user) {
      // Si no hay array de direcciones, inicialízalo
      if (!user.address) user.address = [];
      // Asignar un id incremental si no viene del payload
      const newId = user.address.length > 0 ? Math.max(...user.address.map(a => a.id || 0)) + 1 : 1;
      const newAddress = { ...action.payload, id: action.payload.id || newId };
      user.address = [...user.address, newAddress];
      ctx.patchState({ user: { ...user, address: user.address } });
      this.notificationService.showSuccess('Dirección agregada correctamente');
    }
  }

  @Action(UpdateAddress)
  updateAddress(ctx: StateContext<AccountStateModel>, action: UpdateAddress) {
    // Update Address Logic Here
  }

  @Action(DeleteAddress)
  deleteAddress(ctx: StateContext<AccountStateModel>, action: DeleteAddress) {
    // Delete Address Logic Here
  }


  @Action(AccountClear)
  accountClear(ctx: StateContext<AccountStateModel>){
    ctx.patchState({
      user: null,
      permissions: []
    });
  }
}
