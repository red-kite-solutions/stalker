import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  selector: 'avatar',
  template: `
    <svg width="100%" height="100%" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet">
      <style>
        .avatar-initials-{{ hash }}  {
            font-family: Roboto, 'Helvetica Neue', sans-serif;
            font-weight: 600;
            font-size: 105px;
            fill: {{color}}
          }

          .avatar-background-{{ hash }}  {
            fill: {{backgroundColor}}
          }
      </style>

      <rect *ngIf="!src" class="avatar-background-{{ hash }}" width="200" height="200" x="0" y="0" />
      <text
        *ngIf="!src"
        class="avatar-initials-{{ hash }}"
        x="50%"
        y="55%"
        dominant-baseline="middle"
        text-anchor="middle"
      >
        {{ initials }}
      </text>

      <image *ngIf="src" attr.xlink:href="{{ src }}" width="200" height="200" />
    </svg>
  `,
  styleUrls: ['./avatar.component.scss'],
  imports: [CommonModule],
})
export class AvatarComponent {
  private readonly colors = [
    ['#F5DF4D', '#2C3E50'],
    ['#E3A672', '#2C3E50'],
    ['#E67E22', '#2C3E50'],
    ['#C0392B', '#FFFFFF'],
    ['#EC7063', '#2C3E50'],
    ['#D98880', '#2C3E50'],
    ['#CD6155', '#FFFFFF'],
    ['#76448A', '#FFFFFF'],
    ['#7D3C98', '#FFFFFF'],
    ['#9B59B6', '#FFFFFF'],
    ['#3498DB', '#FFFFFF'],
    ['#3498DB', '#2C3E50'],
    ['#5499C7', '#FFFFFF'],
    ['#1ABC9C', '#2C3E50'],
    ['#16A085', '#FFFFFF'],
    ['#27AE60', '#FFFFFF'],
    ['#58D68D', '#2C3E50'],
    ['#48C9B0', '#2C3E50'],
    ['#76D7C4', '#2C3E50'],
    ['#16A085', '#FFFFFF'],
    ['#F4D03F', '#2C3E50'],
  ];

  @Input() src: string | undefined = undefined;
  @Input() name: string | undefined = undefined;

  get initials(): string | undefined {
    if (!this.name) return undefined;

    return this.name
      .split(' ')
      .filter((x) => x != '')
      .slice(0, 2)
      .map((x) => x[0])
      .join('');
  }

  get color() {
    if (!this.name) return 'transparent';

    return this.colors[this.hash % this.colors.length][1];
  }

  get backgroundColor() {
    if (!this.name) return 'transparent';

    return this.colors[this.hash % this.colors.length][0];
  }

  get hash() {
    if (!this.name) return 0;

    let hash = 0;
    let i;
    let chr;

    if (this.name.length === 0) return hash;
    for (i = 0; i < this.name.length; i++) {
      chr = this.name.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0;
    }
    return Math.abs(hash);
  }
}
