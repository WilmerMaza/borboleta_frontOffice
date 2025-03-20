import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Store } from '@ngxs/store';
import { GetBlogBySlug } from '../store/action/blog.action';
import { Observable } from 'rxjs';

export const BlogResolver: ResolveFn<Observable<any>> = (route, state) => {
  const store = inject(Store);
  const slug = route.paramMap.get('slug');

  if (!slug) {
    throw new Error('Slug parameter is missing');
  }

  return store.dispatch(new GetBlogBySlug(slug));
};
