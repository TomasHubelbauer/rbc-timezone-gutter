import './App.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import React, { Component, ReactElement, ChangeEventHandler } from 'react';
import BigCalendar, { Components } from 'react-big-calendar';
import moment, { MomentZone } from 'moment';
import tz from 'moment-timezone';
import { createPortal } from 'react-dom';

type AppState = {
  leftTimeZone: MomentZone;
  rightTimeZone: MomentZone;
  modal: null | { side: 'left' | 'right'; search: string; };
};

export default class App extends Component<{}, AppState> {
  public readonly state: AppState = {
    leftTimeZone: moment.tz.zone('America/New_York')!,
    rightTimeZone: moment.tz.zone('Europe/Prague')!,
    modal: null,
  };

  private static readonly localizer = BigCalendar.momentLocalizer(moment);

  private static readonly events = [
    {
      title: 'This day',
      start: moment().startOf('day').toDate(),
      end: moment().endOf('day').toDate(),
    },
    {
      title: 'Now for an hour',
      start: moment().toDate(),
      end: moment().add(1, 'hour').toDate(),
    }
  ];

  private components: Components = {
    timeGutterHeader: () => {
      return (
        // Note that `rbc-time-header-gutter` is to have the header dynamically strethed to match the width of the gutter by RBC
        <div className="gutterSplit rbc-time-header-gutter">
          <span>
            <span>{this.state.leftTimeZone.abbr(Date.now())}</span>
            <span>{this.getVulgarUtcOffsetText(this.state.leftTimeZone.utcOffset(Date.now()))}</span>
            <span className="infoIcon" title={this.state.leftTimeZone.name}>i</span>
            <button onClick={this.handleSwitchLeftTimeZoneButtonClick}>…</button>
          </span>
          <span>
            <span>{this.state.rightTimeZone.abbr(Date.now())}</span>
            <span>{this.getVulgarUtcOffsetText(this.state.rightTimeZone.utcOffset(Date.now()))}</span>
            <span className="infoIcon" title={this.state.rightTimeZone.name}>i</span>
            <button onClick={this.handleSwitchRightTimeZoneButtonClick}>…</button>
          </span>
        </div>
      );
    },
    timeSlotWrapper: (props) => {
      const typedProps: { value: Date, resource: null | undefined, children: ReactElement } = props as any;
      if (typedProps.resource === undefined) {
        const dateAndTimeUtc = moment.utc(typedProps.value);
        const dateAndTimeTzLeft = dateAndTimeUtc.clone().tz(this.state.leftTimeZone.name);
        const dateAndTimeTzRight = dateAndTimeUtc.clone().tz(this.state.rightTimeZone.name);
        return (
          <div className="gutterSplit rbc-time-slot">
            <span title={dateAndTimeTzLeft.format()}>
              {dateAndTimeTzLeft.format('HH:mm A')}
            </span>
            <span title={dateAndTimeTzRight.format()}>
              {dateAndTimeTzRight.format('HH:mm A')}
            </span>
          </div>
        );
      }

      return typedProps.children;
    },
  };

  private getVulgarUtcOffsetText(offsetMinutes: number) {
    const offsetSign = ['+', '', '-'][Math.sign(offsetMinutes / 60) + 1 /* Convert sign -1 | 0 | 1 to index 0 | 1 | 2 */];
    const offsetHours = Math.abs(Math.floor(offsetMinutes / 60));
    let offsetHoursFraction = (Math.abs(offsetMinutes / 60) % 1).toFixed(2).substring(1) /* Discard 0 leaving fraction */;

    // http://unicodefractions.com/
    switch (offsetHoursFraction) {
      case '.00': offsetHoursFraction = ''; break;
      case '.25': offsetHoursFraction = `¼`; break;
      case '.50': offsetHoursFraction = `½`; break;
      case '.75': offsetHoursFraction = `¾`; break;
    }

    return `UTC${offsetSign}${offsetHours || ''}${offsetHoursFraction}`;
  }

  private getFractionalUtcOffsetText(offsetMinutes: number) {
    const offsetSign = ['+', '', '-'][Math.sign(offsetMinutes / 60) + 1 /* Convert sign -1 | 0 | 1 to index 0 | 1 | 2 */];
    const offsetFraction = offsetMinutes / 60; // 0.5
    return `UTC${offsetSign}${offsetFraction}`;
  }

  private renderSwitchModal() {
    if (this.state.modal === null) {
      throw new Error('Invalid state');
    }

    let value = '';
    switch (this.state.modal.side) {
      case 'left': value = this.state.leftTimeZone.name; break;
      case 'right': value = this.state.rightTimeZone.name; break;
    }

    const search = this.state.modal.search;
    const results = moment.tz.names()
      .map(n => moment.tz.zone(n)!)
      .map(tz => ({ name: tz.name, offsetMinutes: tz.utcOffset(Date.now()) }))
      .map(tz => ({ name: tz.name, vulgarOffset: this.getVulgarUtcOffsetText(tz.offsetMinutes), fractionalOffset: this.getFractionalUtcOffsetText(tz.offsetMinutes) }))

      // Search the time zone name, vulgar offset and fractional offset to be able to search all time zones with a given offset
      .filter(tz => (tz.name.toUpperCase() + ' ' + tz.vulgarOffset + ' ' + tz.fractionalOffset).includes(search.toUpperCase()));

    return (
      <div className="modal">
        <div>
          Change the {this.state.modal.side} time zone
          <button title="Close" onClick={this.handleCloseModalButtonClick}>✕</button>
        </div>
        <input value={this.state.modal.search} onChange={this.handleSwitchTimeZoneSearchInputChange} placeholder="Search: 'prague', '-2', '.75', …" ref={n => n && n.focus()} />
        <select value={value} onChange={this.handleSwitchTimeZoneSelectChange} size={20}>
          {results.map(tz => <option value={tz.name} key={tz.name}>{tz.name} {tz.vulgarOffset}</option>)}
        </select>
      </div>
    );
  }

  private readonly handleSwitchLeftTimeZoneButtonClick = () => {
    this.setState({ modal: { side: 'left', search: '' } });
  };

  private readonly handleSwitchRightTimeZoneButtonClick = () => {
    this.setState({ modal: { side: 'right', search: '' } });
  };

  private readonly handleSwitchTimeZoneSearchInputChange: ChangeEventHandler<HTMLInputElement> = event => {
    const search = event.currentTarget.value;
    this.setState(state => {
      if (state.modal === null) {
        throw new Error('Invalid state');
      }

      return { modal: { ...state.modal, search } };
    });
  };

  private readonly handleSwitchTimeZoneSelectChange: ChangeEventHandler<HTMLSelectElement> = event => {
    if (this.state.modal === null) {
      throw new Error('Invalid state');
    }

    const tz = moment.tz.zone(event.currentTarget.value)!;
    switch (this.state.modal.side) {
      case 'left': this.setState({ leftTimeZone: tz, modal: null }); return;
      case 'right': this.setState({ rightTimeZone: tz, modal: null }); return;
    }

    throw new Error('Called in an invalid state.');
  };

  private readonly handleCloseModalButtonClick = () => {
    this.setState({ modal: null });
  }

  render() {
    // Note that a reference to `tz` needs to be kept otherwise it gets compiled away even though it is needed for `moment.tz`
    void tz;
    return (
      <>
        <BigCalendar localizer={App.localizer} events={App.events} components={this.components} defaultView="week" scrollToTime={new Date()} />
        {this.state.modal && createPortal(this.renderSwitchModal(), document.body)}
      </>
    );
  }
};
