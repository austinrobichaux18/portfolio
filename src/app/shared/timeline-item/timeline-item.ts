import { Component, Input } from '@angular/core';
import { Experience } from '../../core/models/Experience';

@Component({
  selector: 'app-timeline-item',
  imports: [],
  templateUrl: './timeline-item.html',
  styleUrl: './timeline-item.scss'
})
export class TimelineItem {

  @Input() item!: Experience;

}
