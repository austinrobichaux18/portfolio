import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-skill-chip',
  imports: [],
  templateUrl: './skill-chip.html',
  styleUrl: './skill-chip.scss'
})
export class SkillChip {

    @Input() name = '';

    @Input() level = '';

}
