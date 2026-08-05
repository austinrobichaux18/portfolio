import { Component } from '@angular/core';
import { experience } from '../../core/data/experience';
import { TimelineItem } from '../../shared/timeline-item/timeline-item';

@Component({
  selector: 'app-experience',
  imports: [
    TimelineItem
  ],
  templateUrl: './experience.html',
  styleUrl: './experience.scss'
})
export class Experience {

  experience = experience;

}
