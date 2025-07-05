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
          let products = result.data || [];
          
          // Mapear los datos para convertir _id a id y ajustar la estructura
          products = products.map((product: any) => {
            const price = product.price ? parseFloat(product.price) : 0;
            const discount = product.discount ? parseFloat(product.discount) : 0;
            const sale_price = discount > 0 ? price - (price * discount / 100) : price;
            
            return {
              ...product,
              id: parseInt(product._id) || product.id || 0,
              price: price, // MRP/Precio original
              sale_price: sale_price, // Precio de venta (calculado con descuento)
              discount: discount,
              is_sale_enable: product.is_sale_enable || false,
              stock_status: product.stock_status || 'in_stock',
              quantity: product.quantity ? parseFloat(product.quantity) : 0,
              stock: product.stock ? parseFloat(product.stock) : 0,
              status: product.status !== undefined ? product.status : true,
              categories: product.categories || [],
              attributes: product.attributes || [],
              variations: product.variations ? product.variations.map((variation: any) => {
                const varPrice = variation.price ? parseFloat(variation.price) : 0;
                const varDiscount = variation.discount ? parseFloat(variation.discount) : discount;
                const varSalePrice = varDiscount > 0 ? varPrice - (varPrice * varDiscount / 100) : varPrice;
                
                return {
                  ...variation,
                  id: parseInt(variation._id) || variation.id || 0,
                  price: varPrice,
                  sale_price: varSalePrice,
                  discount: varDiscount,
                  quantity: variation.quantity ? parseFloat(variation.quantity) : 0,
                  status: variation.status !== undefined ? variation.status : true,
                  stock_status: variation.stock_status || 'in_stock',
                  attribute_values: variation.attribute_values || []
                };
              }) : [],
              related_products: product.related_products || [],
              cross_sell_products: product.cross_sell_products || [],
              product_galleries: product.product_galleries || [],
              reviews: product.reviews || [],
              reviews_count: product.reviews_count || 0,
              rating_count: product.rating_count || 0,
              is_featured: product.is_featured || false,
              is_trending: product.is_trending || false,
              is_approved: product.is_approved !== undefined ? product.is_approved : false,
              wholesales: product.wholesales || [],
              wholesale_price_type: product.wholesale_price_type || null,
              is_external: product.is_external || false,
              external_url: product.external_url || null,
              external_button_text: product.external_button_text || null,
              social_share: product.social_share !== undefined ? product.social_share : true,
              is_wishlist: false,
              is_return: product.is_return || false,
              is_free_shipping: product.is_free_shipping || false,
              safe_checkout: product.safe_checkout !== undefined ? product.safe_checkout : true,
              secure_checkout: product.secure_checkout !== undefined ? product.secure_checkout : true,
              encourage_order: product.encourage_order !== undefined ? product.encourage_order : true,
              encourage_view: product.encourage_view !== undefined ? product.encourage_view : true
            };
          });

          ctx.patchState({
            product: {
              data: products,
              total: products.length
            }
          });
        },
        complete: () => {
          this.productService.skeletonLoader = false;
        },
        error: err => {
          this.productService.skeletonLoader = false;
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
    return this.productService.getProductBySlug(slug).pipe(
      tap({
        next: (result: any) => {
          // Extraer los datos del producto de la respuesta
          const productData = result.data || result;
          
          if(productData) {
            // Asegurar que los valores sean números válidos
            const price = productData.price !== null && productData.price !== undefined ? parseFloat(productData.price) : 0;
            const discount = productData.discount !== null && productData.discount !== undefined ? parseFloat(productData.discount) : 0;
            const sale_price = discount > 0 ? price - (price * discount / 100) : price;
            
            const product = {
              ...productData,
              id: productData._id || productData.id || 0,
              price: price, // MRP/Precio original
              sale_price: sale_price, // Precio de venta (calculado con descuento)
              discount: discount,
              is_sale_enable: productData.is_sale_enable || false,
              stock_status: productData.stock_status || 'in_stock',
              quantity: productData.quantity ? parseFloat(productData.quantity) : 0,
              stock: productData.stock ? parseFloat(productData.stock) : 0,
              status: productData.status !== undefined ? productData.status : true,
              categories: productData.categories || [],
              attributes: productData.attributes || [],
              variations: productData.variations ? productData.variations.map((variation: any) => {
                const varPrice = variation.price !== null && variation.price !== undefined ? parseFloat(variation.price) : 0;
                const varDiscount = variation.discount !== null && variation.discount !== undefined ? parseFloat(variation.discount) : discount;
                const varSalePrice = varDiscount > 0 ? varPrice - (varPrice * varDiscount / 100) : varPrice;
                
                return {
                  ...variation,
                  id: variation._id || variation.id || 0,
                  price: varPrice,
                  sale_price: varSalePrice,
                  discount: varDiscount,
                  quantity: variation.quantity ? parseFloat(variation.quantity) : 0,
                  status: variation.status !== undefined ? variation.status : true,
                  stock_status: variation.stock_status || 'in_stock',
                  attribute_values: variation.attribute_values || []
                };
              }) : [],
              related_products: productData.related_products || [],
              cross_sell_products: productData.cross_sell_products || [],
              product_galleries: productData.product_galleries || [],
              reviews: productData.reviews || [],
              reviews_count: productData.reviews_count || 0,
              rating_count: productData.rating_count || 0,
              is_featured: productData.is_featured || false,
              is_trending: productData.is_trending || false,
              is_approved: productData.is_approved !== undefined ? productData.is_approved : false,
              wholesales: productData.wholesales || [],
              wholesale_price_type: productData.wholesale_price_type || null,
              is_external: productData.is_external || false,
              external_url: productData.external_url || null,
              external_button_text: productData.external_button_text || null,
              social_share: productData.social_share !== undefined ? productData.social_share : true,
              is_wishlist: false,
              is_return: productData.is_return || false,
              is_free_shipping: productData.is_free_shipping || false,
              safe_checkout: productData.safe_checkout !== undefined ? productData.safe_checkout : true,
              secure_checkout: productData.secure_checkout !== undefined ? productData.secure_checkout : true,
              encourage_order: productData.encourage_order !== undefined ? productData.encourage_order : true,
              encourage_view: productData.encourage_view !== undefined ? productData.encourage_view : true
            };

            ctx.patchState({
              selectedProduct: product
            });
          }
        },
        error: err => {
          this.themeOptionService.preloader = false;
          throw new Error(err?.error?.message);
        },
        complete: () => {
          this.themeOptionService.preloader = false;
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
    this.productService.skeletonCategoryProductLoader = true;
    return this.productService.getProducts(action.payload).pipe(
      tap({
        next: (result) => {
          const state = ctx.getState();

          result.data.map(product => {
            product['categories_ids']= product?.categories?.map(category => category.id)
          })

          let products = result.data.filter(product => product?.categories_ids?.includes(action.payload!['category_id']));
          products.splice(action.payload!['paginate']);

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
