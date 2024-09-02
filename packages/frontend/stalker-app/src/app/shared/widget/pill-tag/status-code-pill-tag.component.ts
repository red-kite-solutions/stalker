import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-status-code-pill-tag',
  template: `
    <app-pill-tag [color]="_tagColor" [matTooltip]="_tooltip" matTooltipShowDelay="500">{{ _statusCode }}</app-pill-tag>
  `,
})
export class StatusCodePillTagComponent {
  public readonly statusCodes = new Map<string, string>([
    ['100', 'Continue'],
    ['101', 'Switching Protocols'],
    ['102', 'Processing (WebDAV)'],
    ['103', 'Early Hints'],
    ['200', 'OK'],
    ['201', 'Created'],
    ['202', 'Accepted'],
    ['203', 'Non-Authoritative Information'],
    ['204', 'No Content'],
    ['205', 'Reset Content'],
    ['206', 'Partial Content'],
    ['207', 'Multi-Status (WebDAV)'],
    ['208', 'Already Reported (WebDAV)'],
    ['226', 'IM Used (HTTP Delta encoding)'],
    ['300', 'Multiple Choices'],
    ['301', 'Moved Permanently'],
    ['302', 'Found'],
    ['303', 'See Other'],
    ['304', 'Not Modified'],
    ['305', 'Use Proxy Deprecated'],
    ['306', 'unused'],
    ['307', 'Temporary Redirect'],
    ['308', 'Permanent Redirect'],
    ['400', 'Bad Request'],
    ['401', 'Unauthorized'],
    ['402', 'Payment Required Experimental'],
    ['403', 'Forbidden'],
    ['404', 'Not Found'],
    ['405', 'Method Not Allowed'],
    ['406', 'Not Acceptable'],
    ['407', 'Proxy Authentication Required'],
    ['408', 'Request Timeout'],
    ['409', 'Conflict'],
    ['410', 'Gone'],
    ['411', 'Length Required'],
    ['412', 'Precondition Failed'],
    ['413', 'Payload Too Large'],
    ['414', 'URI Too Long'],
    ['415', 'Unsupported Media Type'],
    ['416', 'Range Not Satisfiable'],
    ['417', 'Expectation Failed'],
    ['418', "I'm a teapot"],
    ['421', 'Misdirected Request'],
    ['422', 'Unprocessable Content (WebDAV)'],
    ['423', 'Locked (WebDAV)'],
    ['424', 'Failed Dependency (WebDAV)'],
    ['425', 'Too Early Experimental'],
    ['426', 'Upgrade Required'],
    ['428', 'Precondition Required'],
    ['429', 'Too Many Requests'],
    ['431', 'Request Header Fields Too Large'],
    ['451', 'Unavailable For Legal Reasons'],
    ['500', 'Internal Server Error'],
    ['501', 'Not Implemented'],
    ['502', 'Bad Gateway'],
    ['503', 'Service Unavailable'],
    ['504', 'Gateway Timeout'],
    ['505', 'HTTP Version Not Supported'],
    ['506', 'Variant Also Negotiates'],
    ['507', 'Insufficient Storage (WebDAV)'],
    ['508', 'Loop Detected (WebDAV)'],
    ['510', 'Not Extended'],
    ['511', 'Network Authentication Required'],
  ]);

  private readonly blue = '#0064ff';
  private readonly green = '#20ff00';
  private readonly yellow = '#cfc918';
  private readonly orange = '#c18f1f';
  private readonly red = '#a21b21';
  private readonly black = '#000000';

  public _tagColor!: string;
  public _statusCode!: string;
  public _tooltip!: string;

  @Input()
  public set statusCode(statusCode: string | number) {
    statusCode = statusCode.toString();
    try {
      const sc = Number(statusCode);

      if (sc < 100 || sc > 511) {
        this._tagColor = this.black;
      } else if (sc >= 100 && sc < 200) {
        this._tagColor = this.black;
      } else if (sc >= 200 && sc < 300) {
        this._tagColor = this.green;
      } else if (sc >= 300 && sc < 400) {
        if (sc === 401 || sc === 403) {
          this._tagColor = this.red;
        } else {
          this._tagColor = this.blue;
        }
      } else if (sc >= 400 && sc < 500) {
        this._tagColor = this.yellow;
      } else if (sc >= 500) {
        this._tagColor = this.orange;
      }
    } catch {
      this._tagColor = this.black;
    }
    this._statusCode = statusCode;
    this._tooltip = this.statusCodes.get(this._statusCode) ?? '';
  }
}
