
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { Action, Selector, State, StateContext, Store } from "@ngxs/store";
import { tap } from "rxjs";

import { Product, ProductModel } from "../../interface/product.interface";

import { ProductService } from "../../services/product.service";
import { ThemeOptionService } from "../../services/theme-option.service";

import { GetCategoryProducts, GetMenuProducts, GetMoreProduct, GetProductByIds, GetProductBySearch,
         GetProductBySearchList,
         GetProductBySlug, GetProducts, GetRelatedProducts, GetStoreProducts } from "../action/product.action";
import { Category } from "../../interface/category.interface";

export class ProductStateModel {
  product = {
    data: [] as Product[],
    total: 0
  }
  selectedProduct: Product | null;
  categoryProducts: Product[] | [];
  relatedProducts: Product[] | [];
  storeProducts: Product[] | [];
  dealProducts: Product[] | [];
  menuProducts: Product[] | [];
  productBySearch: Product[] | [];
  productBySearchList: Product[] | [];
  productByIds: Product[] | [];
  moreProduct:  Product[] | [];
}

@State<ProductStateModel>({
  name: "product",
  defaults: {
    product: {
      data: [],
      total: 0
    },
    selectedProduct: null,
    categoryProducts: [],
    relatedProducts: [],
    storeProducts: [],
    dealProducts: [],
    menuProducts: [],
    productBySearch: [],
    productBySearchList: [],
    productByIds: [],
    moreProduct: []
  },
})

@Injectable()
export class ProductState{

  constructor(private store: Store, private router: Router,
    private productService: ProductService, private themeOptionService: ThemeOptionService) {}

  @Selector()
  static product(state: ProductStateModel) {
    return state.product;
  }

  @Selector()
  static productByIds(state: ProductStateModel) {
    return state.productByIds;
  }

  @Selector()
  static productBySearch(state: ProductStateModel) {
    return state.productBySearch;
  }

  @Selector()
  static productBySearchList(state: ProductStateModel) {
    return state.productBySearchList;
  }

  @Selector()
  static selectedProduct(state: ProductStateModel) {
    return state.selectedProduct;
  }

  @Selector()
  static relatedProducts(state: ProductStateModel) {
    return state.relatedProducts;
  }

  @Selector()
  static categoryProducts(state: ProductStateModel) {
    return state.categoryProducts;
  }

  @Selector()
  static storeProducts(state: ProductStateModel) {
    return state.storeProducts;
  }

  @Selector()
  static menuProducts(state: ProductStateModel) {
    return state.menuProducts;
  }

  @Selector()
  static moreProduct(state: ProductStateModel) {
    return state.moreProduct;
  }


  @Action(GetProducts)
  getProducts(ctx: StateContext<ProductStateModel>, action: GetProducts) {
    this.productService.skeletonLoader = true;

    return this.productService.getProducts(action.payload).pipe(

      tap({
        next: (result: ProductModel) => {
          console.log('========== PRODUCTOS DEL BACKEND ==========');
          console.log('Total productos:', result.data?.length);
          
          // Buscar un producto con variaciones
          const productWithVariations = result.data?.find(p => p.variations?.length > 0);
          if (productWithVariations) {
            console.log('✅ Producto CON variaciones encontrado:', productWithVariations.name);
            console.log('   - ID:', productWithVariations.id);
            console.log('   - Attributes:', productWithVariations.attributes);
            console.log('   - Total variaciones:', productWithVariations.variations?.length);
            console.log('   - Primera variación COMPLETA:', productWithVariations.variations?.[0]);
          } else {
            console.log('❌ No hay productos con variaciones');
          }
          console.log('==========================================');
          
          let products = result.data || [];
          if(action?.payload) {
            // Note:- For Internal filter purpose only, once you apply filter logic on server side then you can remove  it as per your requirement.
            // Note:- we have covered only few filters as demo purpose
            
            // Filter by store slug
            if(action?.payload?.['store_slug']) {
              products = products.filter(product => product?.store?.slug == action?.payload?.['store_slug']);
            }
            
            // Filter by category
            if(action?.payload?.['category']) {
              products = products.filter(product => 
                product?.categories?.length &&
                product?.categories?.some(category => action?.payload?.['category']?.split(',')?.includes(category.slug))
              );
            }

            // Sorting
            if(action?.payload?.['sortBy']) {
              const sortBy = action?.payload?.['sortBy'];
              
              products = products.sort((a, b) => {
                switch(sortBy) {
                  case 'asc':
                    return a.id - b.id;
                  
                  case 'desc':
                    return b.id - a.id;
                  
                  case 'a-z':
                    return a.name.localeCompare(b.name);
                  
                  case 'z-a':
                    return b.name.localeCompare(a.name);
                  
                  case 'low-high':
                    const priceA = a.sale_price || a.price;
                    const priceB = b.sale_price || b.price;
                    return priceA - priceB;
                  
                  case 'high-low':
                    const priceHighA = a.sale_price || a.price;
                    const priceHighB = b.sale_price || b.price;
                    return priceHighB - priceHighA;
                  
                  default:
                    return 0;
                }
              });
            } else if(!action?.payload?.['ids']) {
              // Default sorting by ID ascending
              products = products.sort((a, b) => a.id - b.id);
            }

            if(action?.payload?.['search']) {
              products = products.filter(product => product.name.toLowerCase().includes(action?.payload?.['search'].toLowerCase()))
            }

            if(action?.payload?.['brand']){
              products = products.filter(product => product?.brand?.slug === action?.payload?.['brand'])
            }

            // Filter by price ranges
            if(action?.payload?.['price']) {
              const priceRanges = action?.payload?.['price'].split(',');
              
              products = products.filter(product => {
                const productPrice = product.sale_price || product.price;
                
                return priceRanges.some((range: string) => {
                  if(range.includes('-')) {
                    // Range format: "50000-100000"
                    const [min, max] = range.split('-').map(Number);
                    return productPrice >= min && productPrice <= max;
                  } else {
                    // Single value: "50000" (below) or "2000000" (above)
                    const value = Number(range);
                    if(range === '50000') {
                      return productPrice < value;
                    } else if(range === '2000000') {
                      return productPrice > value;
                    }
                    return false;
                  }
                });
              });
            }
          }

          ctx.patchState({
            product: {
              data: products,
              total: products.length ? products.length : result.data.length
            }
          });
        },
        complete: () => {
          this.productService.skeletonLoader = false;
        },
        error: err => {
          throw new Error(err?.error?.message);
        }
      })
    );
  }

  @Action(GetProductByIds)
  getProductByIds(ctx: StateContext<ProductStateModel>, action: GetProductByIds) {
    return this.productService.getProducts(action.payload).pipe(
      tap({
        next: (result: ProductModel) => {
          const state = ctx.getState();
          ctx.patchState({
            ...state,
            productByIds: result.data
          });
        },
        error: err => {
          throw new Error(err?.error?.message);
        }
      })
    );
  }

  @Action(GetProductBySlug)
  getProductBySlug(ctx: StateContext<ProductStateModel>, { slug }: GetProductBySlug) {
    this.themeOptionService.preloader = true;
    return this.productService.getProducts().pipe(

      tap({
        next: results => {
          if(results && results.data) {
            const result = results.data.find(product => product.slug == slug)!;

            result.related_products = result.related_products && result.related_products.length ? result.related_products : [];
            result.cross_sell_products = result.cross_sell_products && result.cross_sell_products.length ? result.cross_sell_products : [];

            const ids = [...result.related_products, ...result.cross_sell_products];
            const categoryIds = [...result?.categories?.map(category => category.id)];
            this.store.dispatch(new GetRelatedProducts({ids: ids?.join(','), category_ids: categoryIds?.join(','), status: 1}));

            const state = ctx.getState();
            ctx.patchState({
              ...state,
              selectedProduct: result
            });
          }
        },
        complete: () => {
          this.themeOptionService.preloader = false;
        },
        error: err => {
          this.router.navigate(['/404']);
          throw new Error(err?.error?.message);
        }
      })
    );
  }

  @Action(GetRelatedProducts)
  getRelatedProducts(ctx: StateContext<ProductStateModel>, action: GetProducts) {
    this.themeOptionService.preloader = true;
    return this.productService.getProducts(action.payload).pipe(
      tap({
        next: (result: ProductModel) => {
          const state = ctx.getState();
          ctx.patchState({
            ...state,
            relatedProducts: result.data
          });
        },
        complete: () => {
          this.themeOptionService.preloader = false;
        },
        error: err => {
          throw new Error(err?.error?.message);
        }
      })
    );
  }

  @Action(GetCategoryProducts)
  getCategoryProducts(ctx: StateContext<ProductStateModel>, action: GetProducts) {
    // Obtener las categorías del estado para ver qué IDs están disponibles
    const currentState = this.store.selectSnapshot(state => state);
    const categories = currentState.category?.category?.data || [];
    
    // Usar el payload original sin conversión
    const backendPayload = { ...action.payload };
    
    this.productService.skeletonCategoryProductLoader = true;
    return this.productService.getProducts(backendPayload).pipe(
      tap({
        next: (result) => {
          const state = ctx.getState();

          result.data.map((product: any) => {
            // Extraer IDs de categorías
            if (product?.categories?.length) {
              const firstCategory = product.categories[0];
              let extractedIds: any[] = [];

              // Caso 1: Categorías como objetos con ID numérico
              if (firstCategory && typeof firstCategory === 'object' && firstCategory.id) {
                extractedIds = product.categories.map((cat: any) => cat.id);
              }
              // Caso 2: Categorías como strings (IDs de MongoDB) - Convertir a numérico
              else if (typeof firstCategory === 'string') {
                extractedIds = product.categories.map((catId: string) => {
                  const categoria = categories.find((cat: any) => cat._id === catId);
                  return categoria?.id || catId;
                });
              }
              // Caso 3: Categorías como números
              else if (typeof firstCategory === 'number') {
                extractedIds = product.categories;
              }
              // Caso 4: Categorías como objetos con _id (MongoDB)
              else if (firstCategory && typeof firstCategory === 'object' && firstCategory._id) {
                extractedIds = product.categories.map((cat: any) => {
                  const categoria = categories.find((c: any) => c._id === cat._id);
                  return categoria?.id || cat._id;
                });
              }

              product['categories_ids'] = extractedIds;
            } else {
              product['categories_ids'] = [];
            }
          });

          // Buscar productos que tengan la categoría específica
          const categoryIdToSearch = action.payload!['category_id'];
          
          // Filtrar productos por la categoría solicitada
          let products = result.data.filter(product => {
            return product?.categories_ids?.includes(categoryIdToSearch);
          });
          
          // Limitar la cantidad de productos según paginación
          products = products.slice(0, action.payload!['paginate']);

          ctx.patchState({
            ...state,
            product: {
              data: [...state.product.data, ...result.data],
              total: state.product.data.length + result.data.length
            },
            categoryProducts: products
          });
          this.productService.skeletonCategoryProductLoader = false;
        },
        complete: () => {
          this.productService.skeletonCategoryProductLoader = false;
          this.themeOptionService.preloader = false;
        },
        error: err => {
          throw new Error(err?.error?.message);
        }
      })
    );
  }

  @Action(GetStoreProducts)
  getStoreProducts(ctx: StateContext<ProductStateModel>, action: GetProducts) {
    return this.productService.getProducts(action.payload).pipe(
      tap({
        next: (result: ProductModel) => {
          const state = ctx.getState();
          ctx.patchState({
            ...state,
            storeProducts: result.data
          });
        },
        error: err => {
          throw new Error(err?.error?.message);
        }
      })
    );
  }

  @Action(GetMenuProducts)
  getMenuProducts(ctx: StateContext<ProductStateModel>, action: GetMenuProducts) {
    return this.productService.getProducts(action.payload).pipe(
      tap({
        next: (result: ProductModel) => {
          const state = ctx.getState();
          ctx.patchState({
            ...state,
            menuProducts: result.data
          });
        },
        error: err => {
          throw new Error(err?.error?.message);
        }
      })
    );
  }

  @Action(GetProductBySearch)
  getProductBySearch(ctx: StateContext<ProductStateModel>, action: GetProductBySearch) {
    this.productService.searchSkeleton = true;
    return this.productService.getProducts(action.payload).pipe(
      tap({
        next: (result) => {
          let products;
          if(action?.payload?.['search']) {
            products = result.data.filter(product => product.name.toLowerCase().includes(action?.payload?.['search'].toLowerCase()))
          } else {
            products = result.data;
          }

          ctx.patchState({
            productBySearch: products.splice(0,4),
          });
        },
        complete: () => {
          this.productService.searchSkeleton = false;
        },
        error: err => {
          throw new Error(err?.error?.message);
        }
      })
    );
  }

  @Action(GetProductBySearchList)
  getProductBySearchList(ctx: StateContext<ProductStateModel>, action: GetProductBySearchList) {
    this.productService.searchSkeleton = true;
    return this.productService.getProductBySearchList(action.payload).pipe(
      tap({
        next: (result) => {
          ctx.patchState({
            productBySearchList: result.data,
          });
        },
        complete: () => {
          this.productService.searchSkeleton = false;
        },
        error: err => {
          throw new Error(err?.error?.message);
        }
      })
    );
  }

  @Action(GetMoreProduct)
  getMoreProduct(ctx: StateContext<ProductStateModel>, action: GetMoreProduct) {
    return this.productService.getProducts(action.payload).pipe(
      tap({
        next: (result: ProductModel) => {
          const state = ctx.getState();

          result.data.map(product => {
            product['categories_ids']= product.categories.map(category => category.id)
          })

          let filteredProducts = result.data.filter(product =>
            action.payload!['category_id']?.some((category_id: number) => product.categories_ids.includes(category_id))
          );

          const page = action.payload!['page']; // e.g., 1 for the first page
          const itemsPerPage = action.payload!['paginate']; // e.g., 4 items per page

          const startIndex = (page - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;

          let paginatedProducts = filteredProducts.length ? filteredProducts : result.data.slice(startIndex, endIndex);
          if(action.value){
            ctx.patchState({
              moreProduct: [...state.moreProduct, ...paginatedProducts]
            });
          }else{
            ctx.patchState({
              moreProduct: [...paginatedProducts]
            });
          }
        },
        error: err => {
          throw new Error(err?.error?.message);
        }
      })
    );
  }


}
