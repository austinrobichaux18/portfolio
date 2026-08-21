import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { experience } from '../../core/data/experience';
import { RevealOnScroll } from '../../shared/reveal-on-scroll/reveal-on-scroll';
import { TimelineItem } from '../../shared/timeline-item/timeline-item';

@Component({
  selector: 'app-experience',
  imports: [
    TimelineItem,
    RouterLink,
    RevealOnScroll
  ],
  templateUrl: './experience.html',
  styleUrl: './experience.scss'
})
export class Experience {

  experience = experience;

}
