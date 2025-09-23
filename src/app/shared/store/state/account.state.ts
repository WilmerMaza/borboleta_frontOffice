import { Injectable } from "@angular/core";
import { Action, Selector, State, StateContext, Store } from "@ngxs/store";
import { tap } from "rxjs";
import { AccountUser, AccountUserUpdatePassword } from "../../interface/account.interface";
import { AccountService } from "../../services/account.service";
import { NotificationService } from "../../services/notification.service";
import { AccountClear, CreateAddress, DeleteAddress, GetAddresses, GetUserDetails, UpdateAddress, UpdateUserPassword, UpdateUserProfile } from "../action/account.action";

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
          if (result?.success && result?.data?.user) {
            ctx.patchState({
              user: result.data.user,
              permissions: result.data.user.permissions || [],
            });
          }
        },
        error: err => {
          throw new Error(err?.error?.message || 'Error al obtener perfil del usuario');
        }
      })
    );
  }

  @Action(GetAddresses)
  getAddresses(ctx: StateContext<AccountStateModel>) {
    return this.accountService.getAddresses().pipe(
      tap({
        next: result => {
          console.log('🏠 === RESPUESTA DIRECCIONES === 🏠');
          console.log('📦 Resultado:', result);
          if (result?.success && result?.data?.addresses) {
            const currentUser = ctx.getState().user;
            console.log('👤 Usuario actual:', currentUser);
            if (currentUser) {
              ctx.patchState({
                user: {
                  ...currentUser,
                  address: result.data.addresses
                }
              });
              console.log('✅ Direcciones actualizadas en el estado');
            }
          } else {
            console.log('⚠️ No se encontraron direcciones o respuesta inválida');
          }
        },
        error: err => {
          console.error('❌ Error al obtener direcciones:', err);
          throw new Error(err?.error?.message || 'Error al obtener direcciones');
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
    console.log('➕ === CREANDO DIRECCIÓN === ➕');
    console.log('📦 Datos de la dirección:', action.payload);
    
    return this.accountService.createAddress(action.payload).pipe(
      tap({
        next: result => {
          console.log('✅ Dirección creada exitosamente:', result);
          
          if (result?.success && result?.data?.address) {
            const currentUser = ctx.getState().user;
            if (currentUser) {
              const updatedAddresses = [...(currentUser.address || []), result.data.address];
              ctx.patchState({
                user: {
                  ...currentUser,
                  address: updatedAddresses
                }
              });
            }
          }
        },
        error: err => {
          console.error('❌ Error al crear dirección:', err);
          throw new Error(err?.error?.message || 'Error al crear dirección');
        }
      })
    );
  }

  @Action(UpdateAddress)
  updateAddress(ctx: StateContext<AccountStateModel>, action: UpdateAddress) {
    console.log('✏️ === ACTUALIZANDO DIRECCIÓN === ✏️');
    console.log('📦 Datos de la dirección:', action.payload);
    console.log('🆔 ID de la dirección:', action.id);
    
    return this.accountService.updateAddress(action.payload, action.id).pipe(
      tap({
        next: result => {
          console.log('✅ Dirección actualizada exitosamente:', result);
          
          if (result?.success && result?.data?.address) {
            const currentUser = ctx.getState().user;
            if (currentUser) {
              const updatedAddresses = currentUser.address?.map(addr => 
                addr.id === action.id ? result.data.address : addr
              ) || [];
              ctx.patchState({
                user: {
                  ...currentUser,
                  address: updatedAddresses
                }
              });
            }
          }
        },
        error: err => {
          console.error('❌ Error al actualizar dirección:', err);
          throw new Error(err?.error?.message || 'Error al actualizar dirección');
        }
      })
    );
  }

  @Action(DeleteAddress)
  deleteAddress(ctx: StateContext<AccountStateModel>, action: DeleteAddress) {
    console.log('🗑️ === ELIMINANDO DIRECCIÓN === 🗑️');
    console.log('🆔 ID de la dirección:', action.id);
    
    return this.accountService.deleteAddress(action.id).pipe(
      tap({
        next: result => {
          console.log('✅ Dirección eliminada exitosamente:', result);
          
          if (result?.success) {
            const currentUser = ctx.getState().user;
            if (currentUser) {
              const updatedAddresses = currentUser.address?.filter(addr => addr.id !== action.id) || [];
              ctx.patchState({
                user: {
                  ...currentUser,
                  address: updatedAddresses
                }
              });
            }
          }
        },
        error: err => {
          console.error('❌ Error al eliminar dirección:', err);
          throw new Error(err?.error?.message || 'Error al eliminar dirección');
        }
      })
    );
  }


  @Action(AccountClear)
  accountClear(ctx: StateContext<AccountStateModel>){
    ctx.patchState({
      user: null,
      permissions: []
    });
  }
}
