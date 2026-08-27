import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatSidenavModule } from '@angular/material/sidenav';
import { map, shareReplay } from 'rxjs';

import { Header } from '../header/header';
import { Sidebar } from '../sidebar/sidebar';

/**
 * Estrutura visual principal do Prumo: cabeçalho, navegação lateral e área
 * de conteúdo. A navegação vira uma gaveta (drawer) em telas menores.
 */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, MatSidenavModule, Header, Sidebar, AsyncPipe],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {
  private readonly breakpointObserver = inject(BreakpointObserver);

  protected readonly isHandset$ = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(
      map((result) => result.matches),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
}
