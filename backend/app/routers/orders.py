from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=schemas.OrderRead, status_code=status.HTTP_201_CREATED)
def create_order(payload: schemas.OrderCreate, db: Session = Depends(get_db)):
  
    customer = db.get(models.Customer, payload.customer_id)
    if not customer:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Customer not found.")

    
    requested: dict[int, int] = {}
    for item in payload.items:
        requested[item.product_id] = requested.get(item.product_id, 0) + item.quantity

    order = models.Order(customer_id=customer.id, total_amount=0)
    total = 0

    try:
        for product_id, qty in requested.items():
          
            product = (
                db.query(models.Product)
                .filter(models.Product.id == product_id)
                .with_for_update()
                .first()
            )
            if not product:
                raise HTTPException(
                    status.HTTP_404_NOT_FOUND,
                    f"Product with id {product_id} not found.",
                )
            if product.quantity < qty:
                raise HTTPException(
                    status.HTTP_409_CONFLICT,
                    f"Insufficient stock for '{product.name}': "
                    f"requested {qty}, available {product.quantity}.",
                )

            
            product.quantity -= qty
            line_total = product.price * qty
            total += line_total
            order.items.append(
                models.OrderItem(
                    product_id=product.id,
                    quantity=qty,
                    unit_price=product.price,
                )
            )

        order.total_amount = total
        db.add(order)
        db.commit()
    except HTTPException:
        db.rollback()  
        raise

    db.refresh(order)
    return order


@router.get("", response_model=list[schemas.OrderRead])
def list_orders(db: Session = Depends(get_db)):
    
    return (
        db.query(models.Order)
        .options(selectinload(models.Order.items))
        .order_by(models.Order.id.desc())
        .all()
    )


@router.get("/{order_id}", response_model=schemas.OrderRead)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = (
        db.query(models.Order)
        .options(selectinload(models.Order.items))
        .filter(models.Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found.")
    return order


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    """
    Cancelling an order restocks the products it reserved. This keeps
    inventory consistent — a cancelled order shouldn't keep stock locked away.
    """
    order = (
        db.query(models.Order)
        .options(selectinload(models.Order.items))
        .filter(models.Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found.")

    try:
        for item in order.items:
            product = (
                db.query(models.Product)
                .filter(models.Product.id == item.product_id)
                .with_for_update()
                .first()
            )
            if product:
                product.quantity += item.quantity
        db.delete(order)
        db.commit()
    except Exception:
        db.rollback()
        raise