import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    // TODO
    const findIfCostumerExists = await this.customersRepository.findById(
      customer_id,
    );

    if (!findIfCostumerExists) {
      throw new AppError('Customer does not exists.');
    }

    const findIfProductsExists = await this.productsRepository.findAllById(
      products,
    );

    if (findIfProductsExists.length !== products.length) {
      throw new AppError('There is not product.');
    }

    const productsOrdered = findIfProductsExists.map(storageProduct => {
      const productOrdered = products.find(
        product => product.id === storageProduct.id,
      );

      if (!productOrdered) {
        throw new AppError('Product does not found.');
      }

      if (storageProduct.quantity < productOrdered.quantity) {
        throw new AppError('Insufficient quantity');
      }

      return {
        product_id: storageProduct.id,
        price: storageProduct.price,
        quantity: productOrdered.quantity,
      };
    });

    const order = await this.ordersRepository.create({
      customer: findIfCostumerExists,
      products: productsOrdered,
    });

    await this.productsRepository.updateQuantity(products);

    return order;
  }
}

export default CreateOrderService;
