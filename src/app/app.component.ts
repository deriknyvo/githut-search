import { Component, HostBinding } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Repository, User } from './interfaces';
import { SearchService } from './services/search.service';
import { LanguageColorsService } from './services/language-colors.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ThemeToogleService } from './theme-toogle/theme-toogle.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  
  public isLoading: boolean = false;
  public isLoadingMore: boolean = false;
  public isShowResult: boolean = false;
  public isShowButtonLoadMore: boolean = false;
  private word: string = '';
  public results: Array<User | Repository | any> = [];
  private storageResults: Array<User | Repository | any> = [];
  private page = 1;
  private filters: any[] = [];
  @HostBinding('class') className = '';
  
  constructor(
    private searchService: SearchService,
    private langService: LanguageColorsService,
    private snackbarService: MatSnackBar,
    private themeToogleService: ThemeToogleService
  ) {
    this.themeToogleService.theme.subscribe(theme => this.className = theme);
  }

  search(word: string): any {
    if (!word) {
      this.results = [];
      this.storageResults = [];
      this.isShowButtonLoadMore = false;
      return false;
    }

    this.word = word;
    this.isLoading = true;
    this.isShowResult = false;
    this.page = 1;

    this.users(this.page).then(users => {
      this.repositories(this.page).then(repositories => {
        const arrConcat = [].concat(...users, ...repositories);

        this.results = this.searchService.orderItemsByName(arrConcat);
        this.storageResults = this.results;
        this.isLoading = false;
        this.isShowResult = true;

        if (users.length < 3 || repositories.length < 3) {
          this.isShowButtonLoadMore = false;
        } else {
          this.isShowButtonLoadMore = true;
        }
      });
    });
  }

  applyFilter(values: any[]) {
    this.filters = values;
    this.isLoading = true;
    this.isShowResult = false;

    this.results = this.filter(values);

    this.isLoading = false;
    this.isShowResult = true;
  }

  filter(values: any[]): any { 
    const isAllTrue = values.every(value => value.selected);
    const isAllFalse = values.every(value => !value.selected);

    if (isAllTrue || isAllFalse) {
      return this.storageResults;
    }

    const filterSelected = values.filter(value => value.selected);
    return this.storageResults.filter(item => item.type == filterSelected[0].id);
  }

  getUserLanguages(repos: any[]) {
    const valuesFiltered = repos.filter(repo => repo.language);
    const valuesMapped = valuesFiltered.map(repo => repo.language);
    const uniques = valuesMapped.filter((value: any, pos: any, self: any) => self.indexOf(value) == pos);
    const languages = uniques.map((language: any) => this.langService.getLanguageStyle(language));

    return languages;
  }

  async formatUsers(users: any) {
    const usersMapped = [];

    for (let index = 0; index < users.items.length; index++) {
      const element = users.items[index];
      const userMapped = await firstValueFrom(this.searchService.getUser(element.login));
      const userRepos = await firstValueFrom(this.searchService.getUserRepos(element.login));
      const userLanguages = this.getUserLanguages(userRepos);

      userMapped.languages = userLanguages;

      userMapped.repos = userRepos.map((repo: any) => {
        return {
          full_name: repo.full_name,
          description: repo.description,
          html_url: repo.html_url,
          stargazers_count: repo.stargazers_count,
          language: this.langService.getLanguageStyle(repo.language),
          forks_count: repo.forks_count,
        }
      })

      usersMapped.push(userMapped);
    }

    return usersMapped;
  }

  async users(page: number) {
    const users = await firstValueFrom(this.searchService.users(this.word, page));

    return await this.formatUsers(users);
  }

  async formatRepositories(repositories: any) {
    for (let index = 0; index < repositories.length; index++) {
      const element = repositories[index];
      const languages = await firstValueFrom(this.searchService.getRepoLanguages(element.languages_url));
      const style = Object.keys(languages).map(key => this.langService.getLanguageStyle(key));

      element.languages = style;
    }

    return repositories;
  }

  async repositories(page: number) {
    const repositories = await firstValueFrom(this.searchService.repositories(this.word, page));

    return await this.formatRepositories(repositories);
  }

  loadMore() {
    this.page++;
    this.isLoadingMore = true;
    this.isShowButtonLoadMore = false;

    this.users(this.page).then(users => {
      this.repositories(this.page).then(repositories => {
        const arrConcat = [].concat(...users, ...repositories);

        this.storageResults = [
          ...this.storageResults,
          ...this.searchService.orderItemsByName(arrConcat)
        ];

        this.results = this.filter(this.filters);
        this.isLoadingMore = false;

        if (users.length < 3 || repositories.length < 3) {
          this.isShowButtonLoadMore = false;
        } else {
          this.isShowButtonLoadMore = true;
        }
      });
    });
  }

  favorite(item: any) {
    const itemIndex = this.storageResults.findIndex((x: any) => x.id === item.id);

    if (itemIndex >= 0) {
      this.storageResults[itemIndex].favorite = true;
      this.results = this.storageResults;

      this.snackbarService.open('Gostei!', 'Fechar', {
        duration: 3000
      });
    }
  }

  unfavorite(item: any) {
    const itemIndex = this.storageResults.findIndex((x: any) => x.id === item.id);

    if (itemIndex >= 0) {
      this.storageResults[itemIndex].favorite = false;
      this.results = this.storageResults;

      this.snackbarService.open('Não gostei!', 'Fechar', {
        duration: 3000
      });
    }
  }

  archive(item: any) {
    const itemIndex = this.storageResults.findIndex((x: any) => x.id === item.id);

    if (itemIndex >= 0) {
      this.storageResults[itemIndex].archived = true;
      this.results = this.storageResults;

      this.snackbarService.open('Arquivado!', 'Fechar', {
        duration: 3000
      });
    }
  }

  unarchive(item: any) {
    const itemIndex = this.storageResults.findIndex((x: any) => x.id === item.id);

    if (itemIndex >= 0) {
      this.storageResults[itemIndex].archived = false;
      this.results = this.storageResults;

      this.snackbarService.open('Desarquivado!', 'Fechar', {
        duration: 3000
      });
    }
  }

}
