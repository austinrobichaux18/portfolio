import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { games } from '../../core/data/games';

@Component({
  selector: 'app-games',
  imports: [RouterLink],
  templateUrl: './games.html',
  styleUrl: './games.scss'
})
export class Games {

    games = games;

    indieTags = [
        'C#',
        'Godot',
        'Architecture',
        'UI',
        'Data Modeling',
        'Algorithms',
        'Systems Design',
        'Independent Product Development'
    ];

}
