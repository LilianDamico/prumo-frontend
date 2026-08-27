import { Component } from '@angular/core';

import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { PageHeader } from '../../../shared/components/page-header/page-header';

@Component({
  selector: 'app-reports-page',
  imports: [PageHeader, EmptyState],
  templateUrl: './reports-page.html',
  styleUrl: './reports-page.scss',
})
export class ReportsPage {}
