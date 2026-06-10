import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SignOutPage } from './sign-out.page';

describe('SignOutPage', () => {
  let component: SignOutPage;
  let fixture: ComponentFixture<SignOutPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SignOutPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
