import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SkillChip } from '../../shared/skill-chip/skill-chip';
import { StatCard } from '../../shared/stat-card/stat-card';

@Component({
  selector: 'app-home',
imports: [
    RouterLink,
    StatCard,
    SkillChip
],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home {

}
