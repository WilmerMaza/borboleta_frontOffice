import { Injectable } from "@angular/core";
import { Action, Selector, State, StateContext } from "@ngxs/store";
import { tap } from "rxjs";

import { Menu } from "../../interface/menu.interface";

import { MenuService } from "../../services/menu.service";
 
import { GetMenu } from "../action/menu.action";

export class MenuStateModel {
  menu = {
    data: [] as Menu[],
    total: 0
  }
}

@State<MenuStateModel>({
  name: "menu",
  defaults: {
    menu: {
      data: [],
      total: 0
    },
  },
})

@Injectable()
export class MenuState {

  constructor(private menuService: MenuService) {}

  @Selector()
  static menu(state: MenuStateModel) {
    return state.menu;
  }

  @Action(GetMenu)
  getMenu(ctx: StateContext<MenuStateModel>, action: GetMenu) {
    this.menuService.skeletonLoader = true;
    return this.menuService.getMenu(action.payload).pipe(
      tap({
        next: result => {
          // Función recursiva para inicializar active: false en todos los menús
          const initializeMenuActive = (menus: any[]): any[] => {
            return menus.map(menu => ({
              ...menu,
              active: false,
              child: menu.child ? initializeMenuActive(menu.child) : []
            }));
          };

          const menusWithActive = result.data ? initializeMenuActive(result.data) : [];

          ctx.patchState({
            menu: {
              data: menusWithActive,
              total: result?.total ? result?.total : result.data?.length
            }
          });
        },
        error: err => {
          throw new Error(err?.error?.message);
        }, 
        complete: () => {
          this.menuService.skeletonLoader = false;
        }
      })
    );
  }

}
