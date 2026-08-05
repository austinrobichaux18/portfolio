import { Component } from '@angular/core';
import { games } from '../../core/data/games';

@Component({
  selector: 'app-games',
  imports: [],
  templateUrl: './games.html',
  styleUrl: './games.scss'
})
export class Games {

    games = games;

}
