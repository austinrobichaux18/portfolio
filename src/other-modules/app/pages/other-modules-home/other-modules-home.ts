import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { modules } from '../../core/data/modules';

@Component({
  selector: 'app-other-modules-home',
  imports: [RouterLink, DatePipe],
  templateUrl: './other-modules-home.html',
  styleUrl: './other-modules-home.scss',
})
export class OtherModulesHome {
  modules = modules;
}
