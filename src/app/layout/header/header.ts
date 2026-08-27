import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';

/**
 * Cabeçalho fixo do aplicativo. Mostra a marca "Prumo" e, em telas
 * menores, o botão para abrir a navegação.
 */
@Component({
  selector: 'app-header',
  imports: [MatToolbarModule, MatButtonModule, MatIconModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  readonly menuToggle = output<void>();

  protected onMenuButtonClick(): void {
    this.menuToggle.emit();
  }
}
