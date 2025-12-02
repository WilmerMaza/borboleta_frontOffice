import { Injectable } from "@angular/core";
import { Action, Selector, State, StateContext, Store } from "@ngxs/store";
import { catchError, of, tap, throwError } from "rxjs";
import {
  AccountUser,
  AccountUserUpdatePassword,
} from "../../interface/account.interface";
import { AccountService } from "../../services/account.service";
import { NotificationService } from "../../services/notification.service";
import {
  AccountClear,
  CreateAddress,
  DeleteAddress,
  GetAddresses,
  GetUserDetails,
  UpdateAddress,
  UpdateUserPassword,
  UpdateUserProfile,
} from "../action/account.action";

export class AccountStateModel {
  user: AccountUser | null;
  permissions: [];
}

@State<AccountStateModel>({
  name: "account",
  defaults: {
    user: null,
    permissions: [],
  },
})
@Injectable()
export class AccountState {
  constructor(
    private store: Store,
    private accountService: AccountService,
    private notificationService: NotificationService
  ) {}

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
        next: (result) => {
          if (result?.success && result?.data?.user) {
            ctx.patchState({
              user: result.data.user,
              permissions: result.data.user.permissions || [],
            });
          }
        },
      }),
      catchError((err) => {
        // Solo silenciar errores 401 cuando NO hay token
        let token = this.store.selectSnapshot((state) => state.auth?.access_token);
        
        // Si no hay token en el estado, verificar localStorage como fallback
        if (!token && typeof window !== 'undefined') {
          try {
            const authStorage = localStorage.getItem('auth');
            if (authStorage) {
              const authData = JSON.parse(authStorage);
              token = authData?.access_token || null;
            }
          } catch (e) {
            // Ignorar errores al parsear
          }
        }
        
        if (err?.status === 401 && !token) {
          // No hay token, error esperado - silenciar completamente
          return of(null);
        }
        // Hay token pero falló o es otro error - propagar el error
        return throwError(() => err);
      })
    );
  }

  @Action(GetAddresses)
  getAddresses(ctx: StateContext<AccountStateModel>) {
    return this.accountService.getAddresses().pipe(
      tap({
        next: (result) => {
          if (result?.success && result?.data?.addresses) {
            const currentUser = ctx.getState().user;
            if (currentUser) {
              ctx.patchState({
                user: {
                  ...currentUser,
                  address: result.data.addresses,
                },
              });
            }
          }
        },
        error: (err) => {
          throw new Error(
            err?.error?.message || "Error al obtener direcciones"
          );
        },
      })
    );
  }

  @Action(UpdateUserProfile)
  updateProfile(
    ctx: StateContext<AccountStateModel>,
    { payload }: UpdateUserProfile
  ) {
    // Update Profile Logic Here
  }

  @Action(UpdateUserPassword)
  updatePassword(
    ctx: StateContext<AccountUserUpdatePassword>,
    { payload }: UpdateUserPassword
  ) {
    // Update Password Logic Here
  }

  @Action(CreateAddress)
  createAddress(ctx: StateContext<AccountStateModel>, action: CreateAddress) {
    return this.accountService.createAddress(action.payload).pipe(
      tap({
        next: (result) => {
          if (result?.success && result?.data?.address) {
            const currentUser = ctx.getState().user;
            if (currentUser) {
              const updatedAddresses = [
                ...(currentUser.address || []),
                result.data.address,
              ];
              ctx.patchState({
                user: {
                  ...currentUser,
                  address: updatedAddresses,
                },
              });
            }
            this.notificationService.showSuccess("Dirección creada con éxito");
          }
        },
        error: (err) => {
          throw new Error(err?.error?.message || "Error al crear dirección");
        },
      })
    );
  }

  @Action(UpdateAddress)
  updateAddress(ctx: StateContext<AccountStateModel>, action: UpdateAddress) {
    return this.accountService.updateAddress(action.payload, action.id).pipe(
      tap({
        next: (result) => {
          if (result?.success && result?.data?.address) {
            const currentUser = ctx.getState().user;
            if (currentUser) {
              const updatedAddresses =
                currentUser.address?.map((addr) =>
                  addr.id === action.id ? result.data.address : addr
                ) || [];
              ctx.patchState({
                user: {
                  ...currentUser,
                  address: updatedAddresses,
                },
              });
            }
          }
        },
        error: (err) => {
          throw new Error(
            err?.error?.message || "Error al actualizar dirección"
          );
        },
      })
    );
  }

  @Action(DeleteAddress)
  deleteAddress(ctx: StateContext<AccountStateModel>, action: DeleteAddress) {
    return this.accountService.deleteAddress(action.id).pipe(
      tap({
        next: (result) => {
          if (result?.success) {
            const currentUser = ctx.getState().user;
            if (currentUser) {
              const updatedAddresses =
                currentUser.address?.filter((addr) => addr.id !== action.id) ||
                [];
              ctx.patchState({
                user: {
                  ...currentUser,
                  address: updatedAddresses,
                },
              });
            }
          }
        },
        error: (err) => {
          throw new Error(err?.error?.message || "Error al eliminar dirección");
        },
      })
    );
  }

  @Action(AccountClear)
  accountClear(ctx: StateContext<AccountStateModel>) {
    ctx.patchState({
      user: null,
      permissions: [],
    });
  }
}
